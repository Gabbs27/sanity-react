/**
 * Builds the Sanity post payloads from the markdown drafts.
 *
 * Reads docs/drafts/*.md, strips the YAML-ish metadata header, converts the
 * body to Portable Text, and writes one JSON payload per post shaped for the
 * backend's POST /api/posts handler.
 *
 * Writes to the scratchpad, not the repo: these are throwaway request bodies.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mdToPortable } from './md-to-portable.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.OUT_DIR || resolve(root, 'build-posts-out');

// Published today, minutes apart so `order(publishedAt desc)` is deterministic
// and the grid doesn't depend on document creation order.
const BASE = '2026-08-20T14:00:00.000Z';
const POSTS = [
  { file: '2026-08-20-auditoria-portfolio.md',            cover: 'auditoria',   offsetMin: 0 },
  { file: '2026-08-20-claude-code-flujo-real.md',         cover: 'claude-code', offsetMin: 5 },
  { file: '2026-08-20-editor-propio-vs-sanity-studio.md', cover: 'editor',      offsetMin: 10 },
];

const assets = JSON.parse(readFileSync(resolve(process.env.ASSET_IDS), 'utf8'));

// The drafts open with a `---` delimited header. Values may be quoted; tags are
// comma separated. Deliberately minimal — no YAML dependency for four keys.
function parseFrontMatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('draft is missing its metadata header');
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    meta[kv[1]] = kv[2].trim().replace(/^["'](.*)["']$/, '$1');
  }
  return { meta, body: m[2].trim() };
}

mkdirSync(OUT, { recursive: true });
const summary = [];

POSTS.forEach((p, i) => {
  const raw = readFileSync(resolve(root, 'docs/drafts', p.file), 'utf8');
  const { meta, body } = parseFrontMatter(raw);

  const publishedAt = new Date(Date.parse(BASE) + p.offsetMin * 60_000).toISOString();
  const payload = {
    title: meta.title,
    slug: { _type: 'slug', current: meta.slug },
    excerpt: meta.excerpt,
    tags: meta.tags.split(',').map((t) => t.trim()).filter(Boolean),
    mainImage: {
      _type: 'image',
      asset: { _type: 'reference', _ref: assets[p.cover] },
    },
    publishedAt,
    sponsored: false,
    affiliateDisclosure: false,
    body: mdToPortable(body),
  };

  writeFileSync(resolve(OUT, `post-${i + 1}.json`), JSON.stringify(payload, null, 2));
  summary.push({
    n: i + 1,
    title: payload.title,
    slug: payload.slug.current,
    bloques: payload.body.length,
    palabras: body.split(/\s+/).length,
    tags: payload.tags.length,
    publishedAt,
  });
});

console.table(summary);
