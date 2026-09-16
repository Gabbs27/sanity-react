/**
 * Cross-posts the English drafts to dev.to with a canonical back to the site.
 *
 * WHY canonical_url matters: without it the dev.to copy and codewithgabo.com
 * compete for the same query, and dev.to wins on domain authority — you end up
 * ranking a copy of your own article on somebody else's domain.
 *
 * Links back carry UTM parameters because dev.to marks outbound links
 * rel="noopener noreferrer", and noreferrer strips the Referer header. Without
 * the parameters the traffic arrives as direct and is invisible in analytics.
 *
 * Reads DEVTO_API_KEY from .env (gitignored). Refuses to post a slug that is
 * already on the account: dev.to has no unique constraint, so a second run
 * would silently create a duplicate article rather than fail.
 *
 *   node scripts/devto-publish.mjs           # dry run, prints what it would send
 *   node scripts/devto-publish.mjs --publish
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLISH = process.argv.includes('--publish');
const API = 'https://dev.to/api';

const env = Object.fromEntries(
  readFileSync(resolve(ROOT, '.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const KEY = env.DEVTO_API_KEY;
if (!KEY) throw new Error('No DEVTO_API_KEY in .env');

// dev.to allows at most 4 tags, lowercase alphanumeric only.
const POSTS = [
  {
    slug: 'the-claro-claim-what-is-known-and-what-is-not',
    draft: 'docs/drafts/the-claro-claim-what-is-known-and-what-is-not.md',
    title: 'The Claro Claim: What Is Known, What Is Not, and What to Do Anyway',
    tags: 'security, privacy, webdev',
    cover:
      'https://cdn.sanity.io/images/nnt7ytcd/production/45662a9b45903ab761b272d74cd3553f7446a4db-1200x630.png',
  },
  {
    slug: 'lo-de-claro-que-se-sabe-y-que-no',
    draft: 'docs/drafts/lo-de-claro-que-se-sabe-y-que-no.md',
    title: 'Lo de Claro: qué se sabe, qué no, y qué hacer igual',
    tags: 'security, privacy, webdev',
    cover:
      'https://cdn.sanity.io/images/nnt7ytcd/production/311b7eb4bd22f31e1dd307ee79bf3ace4649fba5-1200x630.png',
  },
];

const headers = {
  'api-key': KEY,
  accept: 'application/vnd.forem.api-v1+json',
  'content-type': 'application/json',
};

const mine = await (await fetch(`${API}/articles/me?per_page=100`, { headers })).json();
const taken = new Set(mine.map((a) => a.canonical_url).filter(Boolean));

for (const p of POSTS) {
  const canonical = `https://codewithgabo.com/${p.slug}`;
  if (taken.has(canonical)) {
    console.log(`[skip] ${p.slug} — already on dev.to`);
    continue;
  }

  const utm = `utm_source=devto&utm_medium=referral&utm_campaign=${p.slug}`;
  const body = readFileSync(resolve(ROOT, p.draft), 'utf8').trim();
  const front =
    `---\n` +
    `title: ${p.title}\n` +
    `published: true\n` +
    `tags: ${p.tags}\n` +
    `cover_image: ${p.cover}?w=1000&h=420&fit=crop&auto=format&q=80\n` +
    `canonical_url: ${canonical}\n` +
    `---\n\n`;
  const footer =
    `\n\nI write up the things I break and fix at ` +
    `[codewithgabo.com](https://codewithgabo.com/allpost?${utm}).`;

  const markdown = front + body + footer;

  if (!PUBLISH) {
    console.log(`[dry] ${p.slug} — ${markdown.length} chars, tags: ${p.tags}`);
    continue;
  }

  // dev.to rate-limits article creation harder than the docs suggest: a 4s gap
  // between posts returned 429 on the third one, with "try again in 30 seconds"
  // in the body. A 429 is not a failure, it is a wait — treat it as one, or the
  // run reports a post as failed when nothing was wrong with it.
  let out;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(`${API}/articles`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ article: { body_markdown: markdown } }),
    });
    out = await res.json();
    if (res.ok) break;
    if (res.status === 429 && attempt < 4) {
      const wait = 35_000 * attempt;
      console.log(`[wait] ${p.slug} — rate limited, retrying in ${wait / 1000}s`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    console.error(`[fail] ${p.slug} — HTTP ${res.status}: ${JSON.stringify(out).slice(0, 300)}`);
    out = null;
    break;
  }
  if (!out) continue;
  console.log(`[published] ${p.slug} -> ${out.url}`);
  await new Promise((r) => setTimeout(r, 35_000));
}
