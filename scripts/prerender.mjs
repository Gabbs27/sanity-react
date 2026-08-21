/**
 * Build-time head prerender for blog posts.
 *
 * WHY THIS EXISTS
 * The app is a client-rendered SPA and SEO.tsx writes the title, description,
 * canonical and og:* tags from a useEffect. The HTML actually served is
 * byte-identical for every URL and carries the homepage's metadata.
 *
 * Googlebot renders JS on a second pass, so for search that is a delay rather
 * than a defect. For social it is fatal: LinkedIn, X, WhatsApp, Slack and
 * Discord do not execute JavaScript, so every shared post previewed as the same
 * generic portfolio card. Sharing links is the only distribution channel this
 * site has, and it was broken.
 *
 * HOW
 * Reads the posts straight from Sanity — the same source the app renders from,
 * so there is no second copy of the metadata to drift — and writes
 * build/<slug>/index.html: the normal shell with a real head baked in.
 * vercel.json serves those files when they exist and falls back to index.html.
 *
 * An earlier version drove headless Chrome and read the rendered head. It
 * worked locally and was useless in practice: Vercel's build image has no
 * Chrome, so the step would silently skip on every real deploy.
 *
 * Only the head is baked. React mounts with createRoot and would discard
 * prerendered body markup anyway.
 */
import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = join(root, 'build');
const ORIGIN = 'https://codewithgabo.com';
const FALLBACK_IMAGE = `${ORIGIN}/og-image.jpg`;

// Same table src/config/translations.ts reads. This script cannot import the
// TypeScript module, and duplicating the slugs here is how the two halves drift
// apart, so both sides read the JSON.
const translations = JSON.parse(
  readFileSync(join(root, 'src/config/translations.json'), 'utf8')
);
const SPANISH_POSTS = new Set(translations.spanishPosts);
const PAIRS = translations.pairs;

const client = createClient({
  projectId: 'nnt7ytcd',
  dataset: 'production',
  apiVersion: '2023-03-01',
  useCdn: true,
});

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Mirrors OnePost's own fallback: the excerpt, or the opening of the body.
function description(post) {
  const text = (post.excerpt || post.plainBody || '').replace(/\s+/g, ' ').trim();
  if (!text) return 'A post on codewithgabo.com by Gabriel Abreu.';
  return text.length > 300 ? `${text.slice(0, 297).trimEnd()}…` : text;
}

const posts = await client.fetch(
  `*[_type == "post" && defined(slug.current) && !(_id in path("drafts.**"))]{
     "slug": slug.current,
     title,
     excerpt,
     publishedAt,
     "image": mainImage.asset->url,
     "plainBody": pt::text(body)
   }`
);

const shell = readFileSync(join(BUILD, 'index.html'), 'utf8');

let written = 0;
for (const post of posts) {
  if (!post.slug || !post.title) continue;

  const url = `${ORIGIN}/${post.slug}`;
  const lang = SPANISH_POSTS.has(post.slug) ? 'es' : 'en';
  const pair = PAIRS.find((p) => p.es === post.slug || p.en === post.slug);
  const alternates = pair
    ? `
    <link rel="alternate" hreflang="es" href="${esc(`${ORIGIN}/${pair.es}`)}" />
    <link rel="alternate" hreflang="en" href="${esc(`${ORIGIN}/${pair.en}`)}" />
    <link rel="alternate" hreflang="x-default" href="${esc(`${ORIGIN}/${pair.en}`)}" />`
    : '';
  const title = post.title.includes('Gabriel Abreu')
    ? post.title
    : `${post.title} | Gabriel Abreu`;
  const desc = description(post);
  const image = post.image || FALLBACK_IMAGE;

  const head = `
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}" />
    <meta name="author" content="Gabriel Abreu" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${esc(url)}" />${alternates}
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:site_name" content="Code With Gabo" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(desc)}" />
    <meta name="twitter:image" content="${esc(image)}" />
    <script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: desc,
      image,
      datePublished: post.publishedAt,
      mainEntityOfPage: url,
      author: { '@type': 'Person', name: 'Gabriel Abreu', url: `${ORIGIN}/gabriel-abreu` },
    })}</script>
`;

  // Keep everything the shell's head already carries that is not metadata —
  // the stylesheet links, the module preloads, the analytics and AdSense tags —
  // and drop only the tags this head replaces.
  const shellHead = shell.match(/<head[^>]*>([\s\S]*?)<\/head>/i)[1];
  const kept = shellHead
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+(?:name|property)="(?:description|keywords|author|robots|og:[^"]*|twitter:[^"]*)"[^>]*>/gi, '')
    .replace(/<link[^>]+rel="canonical"[^>]*>/gi, '')
    .replace(/<meta\s+charset[^>]*>/gi, '')
    .replace(/<meta\s+name="viewport"[^>]*>/gi, '');

  // The shell hardcodes <html lang="en">. Only the head was ever rewritten, so
  // every Spanish post shipped as English to anything that does not run JS.
  const out = shell
    .replace(/<head([^>]*)>[\s\S]*?<\/head>/i, `<head$1>${head}${kept}</head>`)
    .replace(/<html([^>]*)\slang="[^"]*"/i, `<html$1 lang="${lang}"`);

  const dir = join(BUILD, post.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), out);
  written++;
}

console.log(`[prerender] ${written}/${posts.length} post heads written`);
