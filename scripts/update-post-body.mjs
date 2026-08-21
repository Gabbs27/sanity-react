/**
 * Replaces an existing post's body from a markdown file.
 *
 *   ADMIN_TOKEN=... node scripts/update-post-body.mjs <postId> <file.md> [--dry]
 *
 * Converts the markdown to Portable Text with the same converter used for new
 * posts, validates the result, and PUTs it to the backend's post endpoint.
 * Pass --dry to print the summary without touching the network.
 *
 * Replacing the body drops any inline images the post had. That is intended for
 * the 2023 posts whose code lived in screenshots — the code is now real text,
 * so the screenshots would only duplicate it.
 */
import { readFileSync } from 'node:fs';
import { mdToPortable } from './md-to-portable.mjs';

const API = process.env.API_URL || 'https://analytics-backend-seven.vercel.app';
const [, , postId, file, ...flags] = process.argv;
const dry = flags.includes('--dry');

if (!postId || !file) {
  console.error('usage: node scripts/update-post-body.mjs <postId> <file.md> [--dry]');
  process.exit(1);
}

const markdown = readFileSync(file, 'utf8').trim();
const body = mdToPortable(markdown);

// The same checks the new-post build runs. A malformed body is not worth a
// network round trip, and a broken block only shows up once it is live.
const errors = [];
const VALID_STYLES = new Set(['normal', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'code']);
const keys = body.map((b) => b._key);

if (body.length < 20) errors.push(`only ${body.length} blocks — suspiciously short`);
if (new Set(keys).size !== keys.length) errors.push('duplicate block _key');
if (keys.some((k) => !k)) errors.push('block missing _key');

for (const b of body) {
  if (b._type !== 'block') errors.push(`unrenderable block type: ${b._type}`);
  if (b._type === 'block' && !VALID_STYLES.has(b.style)) errors.push(`invalid style: ${b.style}`);
  for (const span of b.children || []) {
    for (const mark of span.marks || []) {
      if (['strong', 'em', 'code', 'underline', 'strike-through'].includes(mark)) continue;
      if (!(b.markDefs || []).some((md) => md._key === mark)) errors.push(`mark with no definition: ${mark}`);
    }
  }
  for (const md of b.markDefs || []) {
    if (!(b.children || []).some((c) => (c.marks || []).includes(md._key))) {
      errors.push(`orphan markDef: ${md.href}`);
    }
  }
}

const summary = {
  postId,
  file,
  words: markdown.split(/\s+/).length,
  blocks: body.length,
  headings: body.filter((b) => /^h[1-4]$/.test(b.style)).length,
  codeBlocks: body.filter((b) => b.style === 'code').length,
  links: body.reduce((n, b) => n + (b.markDefs || []).length, 0),
};
console.log(JSON.stringify(summary, null, 1));

if (errors.length) {
  console.error('VALIDATION FAILED:\n  ' + [...new Set(errors)].join('\n  '));
  process.exit(1);
}

if (dry) {
  console.log('dry run — nothing sent');
  process.exit(0);
}

const token = process.env.ADMIN_TOKEN;
if (!token) {
  console.error('ADMIN_TOKEN not set');
  process.exit(1);
}

const res = await fetch(`${API}/api/posts/${postId}`, {
  method: 'PUT',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ body }),
});

if (!res.ok) {
  console.error(`PUT failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
console.log(`updated ${postId} — ${summary.blocks} blocks, ${summary.codeBlocks} code`);
