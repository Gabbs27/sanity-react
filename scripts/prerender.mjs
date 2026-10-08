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
import { toHtml } from './portable-to-html.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = join(root, 'build');
const ORIGIN = 'https://codewithgabo.com';
const FALLBACK_IMAGE = `${ORIGIN}/og-image.jpg`;
const DESCRIPTION_FALLBACK =
  'Portfolio, blog and open-source projects by Gabriel Abreu. React, TypeScript, C#.';

// Same table src/config/translations.ts reads. This script cannot import the
// TypeScript module, and duplicating the slugs here is how the two halves drift
// apart, so both sides read the JSON.
const translations = JSON.parse(
  readFileSync(join(root, 'src/config/translations.json'), 'utf8')
);

// The project cards, from the same file src/assets/data.ts reads. See that file
// for why the list is JSON rather than a second copy living here.
const projects = JSON.parse(
  readFileSync(join(root, 'src/config/projects.json'), 'utf8')
);

// The GitHub snapshot. /repositorios fetches this list from api.github.com in
// the browser, so without it the page served its chrome and nothing else. See
// scripts/fetch-repos.mjs for why the snapshot is committed instead of fetched
// at build time.
const { repos } = JSON.parse(readFileSync(join(root, 'src/config/repos.json'), 'utf8'));
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

// Newest first, like Portfolio.tsx and AllPosts.tsx. Unordered, GROQ returned
// Sanity's default order and the no-JS home listed a 2023 tutorial first: the
// first thing a crawler that doesn't run the bundle saw of the blog.
const posts = await client.fetch(
  `*[_type == "post" && defined(slug.current) && !(_id in path("drafts.**"))] | order(publishedAt desc){
     "slug": slug.current,
     title,
     excerpt,
     publishedAt,
     "image": mainImage.asset->url,
     "plainBody": pt::text(body),
       body[]{..., _type == "image" => { ..., "asset": asset->{url} }},
     "embed": {
       title, slug, mainImage{ asset->{ _id, url } }, body, excerpt,
       "name": author->name, publishedAt, sponsored, affiliateDisclosure
     }
   }`
);

// The post as OnePost.tsx fetches it, field for field, serialised into an inert
// <script type="application/json"> in the page's head.
//
// WHY: on 2026-09-29 Search Console marked /chrome-ya-trae-un-modelo-adentro a
// Soft 404. Googlebot had rendered the page eleven minutes after a deploy, the
// Sanity fetch did not resolve in time, and OnePost treated a failed request
// exactly like an empty one: it rendered <NotFound />, which writes a 404
// title and a noindex into the head. Googlebot executes JavaScript and ignores
// <noscript>, so the full body baked below for the crawlers that do not run
// the bundle was no help to the one that does. Any hiccup of the fetch during
// Google's render turned a real post into a self-declared 404.
//
// With the data in the page, the first render is the article, before any
// request leaves the browser. The fetch still runs and replaces it, so an edit
// in Sanity shows up without a deploy; the embed only decides what the page
// says while the answer is on its way, or if it never arrives.
//
// JSON, not HTML: esc() must NOT touch this. The one character that matters is
// "<", because "</script>" inside a post would end the element early and hand
// the rest of the body to the HTML parser. JSON.parse reads \u003c back as
// "<". U+2028 and U+2029 are valid inside a JSON string but are line
// terminators to a JavaScript parser, so they are escaped too: it costs
// nothing and keeps the payload safe should it ever be read as script.
const embedJson = (embed) =>
  JSON.stringify(embed)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

const shell = readFileSync(join(BUILD, 'index.html'), 'utf8');

let written = 0;
// The heaviest embedded payload, so growth shows up in the build log rather
// than in a slower first paint six months from now.
let largestEmbed = { bytes: 0, slug: '' };
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
  // Cropped to the card's frame here rather than left to whoever renders it.
  // Seven of the covers are portrait or 1.75:1; those were being framed by
  // Twitter's rules. fm=jpg because a social crawler is not a browser and may
  // not advertise WebP, so auto=format would gamble the card on a guess.
  const image = post.image
    ? `${post.image}?w=1200&h=630&fit=crop&fm=jpg&q=80`
    : FALLBACK_IMAGE;

  const data = embedJson(post.embed);
  const dataBytes = Buffer.byteLength(data);
  if (dataBytes > largestEmbed.bytes) largestEmbed = { bytes: dataBytes, slug: post.slug };

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
    <script id="post-data" type="application/json">${data}</script>
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
  // The body a consumer without JavaScript reads.
  //
  // Every page of this site served 46 characters — "You need to enable
  // JavaScript to run this app." — and zero links, to anything that does not
  // execute the bundle. That is the whole page for such a reader: one sentence,
  // and it is an error message. Google's own list of AdSense rejection reasons
  // names exactly that shape twice, under insufficient content and under site
  // navigation.
  //
  // This is not cloaking. Cloaking serves DIFFERENT content depending on who
  // asks. This serves the same content to a client that cannot run the
  // interactive version, and React never sees it: createRoot mounts into #root
  // and leaves everything outside it alone.
  const others = posts
    .filter((p) => p.slug !== post.slug)
    .slice(0, 8)
    .map((p) => `<li><a href="/${esc(p.slug)}">${esc(p.title)}</a></li>`)
    .join('');

  const noscript = `<noscript>
  <article>
    <h1>${esc(post.title)}</h1>
    <p><em>${esc(desc)}</em></p>
    ${toHtml(post.body)}
  </article>
  <nav>
    <h2>More posts</h2>
    <ul>${others}</ul>
    <p><a href="/">Home</a> · <a href="/allpost">All posts</a></p>
  </nav>
</noscript>`;

  // Function replacers, not replacement strings: String.prototype.replace
  // reads "$1", "$&", "$`" and "$'" in a string as substitution patterns, and
  // the post body travels through these calls twice, in the noscript and in
  // the JSON above. `echo "$1"` in a bash snippet is ordinary content here;
  // as a pattern it is the first group of the <head> regex, which the shell
  // leaves empty, and "$'" is the rest of the document. A function's return
  // value is taken as it is. The static routes and the shell below follow
  // suit, so there is one rule to remember.
  const out = shell
    .replace(/<head([^>]*)>[\s\S]*?<\/head>/i, (_, attrs) => `<head${attrs}>${head}${kept}</head>`)
    .replace(/<html([^>]*)\slang="[^"]*"/i, (_, attrs) => `<html${attrs} lang="${lang}"`)
    .replace(/<noscript>[\s\S]*?<\/noscript>/i, () => noscript);

  const dir = join(BUILD, post.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), out);
  written++;
}

// The routes that are not posts. Their content comes from React components, so
// prerender.mjs cannot query it the way it queries Sanity; scripts/capture-static.mjs
// renders them in a browser and commits the result, because Vercel's build image
// has no Chrome. See that file for why the capture carries a source hash.
const staticPages = JSON.parse(
  readFileSync(join(root, 'src/config/static-pages.json'), 'utf8')
);

for (const [route, page] of Object.entries(staticPages)) {
  const url = `${ORIGIN}${route}`;
  const desc = page.description || DESCRIPTION_FALLBACK;

  // The blog index renders its cards from a Sanity fetch that had not resolved
  // when the capture ran. The list is right here, so append it rather than
  // waiting longer in a browser and hoping.
  // Two routes render a list fetched at runtime — /allpost from Sanity,
  // /repositorios from api.github.com — so the capture may or may not include
  // it depending on whether the request beat the timeout. That is the whole
  // problem: the capture is timing-dependent, and both outcomes look fine.
  // /allpost was captured with its fetch unresolved and /repositorios with six
  // of its cards already painted, on the same run.
  //
  // So the list is appended here from data that is not timing-dependent, minus
  // anything the capture already shows. Filtering on the link rather than
  // trusting either side means a capture that catches nothing and a capture
  // that catches everything both produce exactly one copy.
  const listed = (href) => page.html.includes(`href="${href}"`);
  let extra = '';
  if (route === '/allpost') {
    const missing = posts.filter((p) => !listed(`/${p.slug}`));
    extra = missing.length
      ? `<h2>Posts</h2><ul>${missing
          .map((p) => `<li><a href="/${esc(p.slug)}">${esc(p.title)}</a></li>`)
          .join('')}</ul>`
      : '';
  } else if (route === '/repositorios') {
    const missing = repos.filter((r) => !listed(r.html_url));
    extra =
      (missing.length
        ? `<h2>Repositories</h2><ul>${missing
            .map((r) => {
              const meta = [r.language, r.description].filter(Boolean).map(esc).join(' — ');
              return `<li><a href="${esc(r.html_url)}">${esc(r.name)}</a>${meta ? ` — ${meta}` : ''}</li>`;
            })
            .join('')}</ul>`
        : '') +
      `<p><a href="https://github.com/Gabbs27">All repositories on GitHub</a> · ` +
      `<a href="/">Portfolio</a> · <a href="/allpost">Blog</a></p>`;
  }

  const head = `
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(page.title)}</title>
    <meta name="description" content="${esc(desc)}" />
    <meta name="author" content="Gabriel Abreu" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${esc(url)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:title" content="${esc(page.title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:image" content="${esc(FALLBACK_IMAGE)}" />
    <meta property="og:site_name" content="Code With Gabo" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(page.title)}" />
    <meta name="twitter:description" content="${esc(desc)}" />
    <meta name="twitter:image" content="${esc(FALLBACK_IMAGE)}" />
`;

  const shellHead = shell.match(/<head[^>]*>([\s\S]*?)<\/head>/i)[1];
  const kept = shellHead
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+(?:name|property)="(?:description|keywords|author|robots|og:[^"]*|twitter:[^"]*)"[^>]*>/gi, '')
    .replace(/<link[^>]+rel="canonical"[^>]*>/gi, '')
    .replace(/<meta\s+charset[^>]*>/gi, '')
    .replace(/<meta\s+name="viewport"[^>]*>/gi, '');

  const out = shell
    .replace(/<head([^>]*)>[\s\S]*?<\/head>/i, (_, attrs) => `<head${attrs}>${head}${kept}</head>`)
    .replace(/<noscript>[\s\S]*?<\/noscript>/i, () => `<noscript>${page.html}${extra}</noscript>`);

  const dir = join(BUILD, route.replace(/^\//, ''));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), out);
  written++;
}

// The shell answers "/" and, through the catch-all rewrite, every route with no
// prerendered file of its own — /allpost among them. Without this it is the one
// page with no way out for a reader who cannot run the bundle.
//
// The projects belong here as much as the posts do. This is a portfolio site
// whose portfolio was the one thing the noscript never mentioned: the fix that
// gave every post its body left the home page listing posts only, so a reader
// without JavaScript got the blog and no evidence that any of the work existed.
const projectList = projects
  .map(
    (p) =>
      `<li><a href="${esc(p.url)}">${esc(p.title)}</a>` +
      (p.urlAntes ? ` · <a href="${esc(p.urlAntes)}">2023 version</a>` : '') +
      ` — ${esc(p.description)} <em>${esc((p.languages || []).join(', '))}</em></li>`
  )
  .join('');

const shellNoscript = `<noscript>
  <h1>Code With Gabo</h1>
  <p>Gabriel Abreu — full-stack developer in Santo Domingo, Dominican Republic.
  React and TypeScript on the front, C# and .NET on the back. Notes on what I
  build and what breaks, in English and Spanish.</p>
  <h2>Projects</h2>
  <ul>${projectList}</ul>
  <h2>Posts</h2>
  <ul>${posts
    .map((p) => `<li><a href="/${esc(p.slug)}">${esc(p.title)}</a></li>`)
    .join('')}</ul>
  <p><a href="/allpost">All posts</a> · <a href="/about">About</a> ·
  <a href="/services">Services</a> · <a href="/gabriel-abreu">Contact</a></p>
</noscript>`;

writeFileSync(
  join(BUILD, 'index.html'),
  shell.replace(/<noscript>[\s\S]*?<\/noscript>/i, () => shellNoscript)
);

console.log(
  `[prerender] ${written} pages written (${posts.length} posts + ${Object.keys(staticPages).length} static); ` +
    `largest embedded post payload ${(largestEmbed.bytes / 1024).toFixed(1)} KB (${largestEmbed.slug})`
);
