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
    slug: 'generating-the-xml-is-not-invoicing',
    draft: 'docs/drafts/generating-the-xml-is-not-invoicing.md',
    title: "Generating the XML Isn't Invoicing: What I Learned Building a Dominican E-Invoice Issuer",
    tags: 'webdev, javascript, xml, showdev',
    cover:
      'https://cdn.sanity.io/images/nnt7ytcd/production/82cd7e8d875be907c94bbea9ab7b513e09952568-1200x630.png',
  },
  {
    slug: 'generar-el-xml-no-es-facturar',
    draft: 'docs/drafts/generar-el-xml-no-es-facturar.md',
    title: 'Generar el XML no es facturar: lo que aprendí construyendo un emisor de e-CF',
    tags: 'webdev, javascript, xml, showdev',
    cover:
      'https://cdn.sanity.io/images/nnt7ytcd/production/537bbbcec508947e7503ce73cc081574fb1703f8-1200x630.png',
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
    // Leer como texto y parsear después. dev.to contesta JSON cuando la API
    // responde, pero cuando responde lo que tiene delante — un límite de
    // peticiones o un 5xx servido como página HTML — `res.json()` revienta con
    // "Unexpected token '<'" y tumba la corrida a mitad, con un post arriba y
    // el otro no. Pasó con el segundo post de un par, a 35 s del primero.
    const raw = await res.text();
    try {
      out = JSON.parse(raw);
    } catch {
      out = { error: `respuesta no-JSON (${raw.slice(0, 60).replace(/\s+/g, ' ')}…)` };
    }
    if (res.ok && out.url) break;
    const reintentable = res.status === 429 || res.status >= 500 || !out.url;
    if (reintentable && attempt < 4) {
      const wait = 35_000 * attempt;
      console.log(`[wait] ${p.slug} — HTTP ${res.status}, retrying in ${wait / 1000}s`);
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
