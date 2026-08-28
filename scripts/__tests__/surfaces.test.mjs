/**
 * Assertions over the surfaces a consumer actually reads.
 *
 * WHY THIS FILE EXISTS: the hreflang bug shipped because the check was
 * watching the browser DOM, which is inside my process and one console.log
 * away, while the surface that mattered was the response body, which needed a
 * different tool. Nothing here looks at the DOM. Everything here reads what
 * gets written to disk and shipped.
 *
 * It runs against build/, not production, so a broken surface fails before the
 * deploy rather than after it.
 *
 *   npm run build && node --test scripts/__tests__/
 *
 * Two ideas from Heinrich Neb's comments on dev.to shaped this:
 *
 *   1. A grep-check needs a negative control against NEIGHBOURING strings, not
 *      just against absence. Every page serves <link rel="alternate"> for the
 *      RSS feed. Grepping for "alternate" to prove hreflang works finds the
 *      feed and looks like success. So the hreflang assertions here also assert
 *      that the feed link is present and is NOT what they matched.
 *
 *   2. Count the surfaces nobody is asking about. The list below is meant to be
 *      the whole inventory, so adding a surface means adding a case here.
 */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const BUILD = join(ROOT, 'build');
const ORIGIN = 'https://codewithgabo.com';

const translations = JSON.parse(
  readFileSync(join(ROOT, 'src/config/translations.json'), 'utf8')
);
const SPANISH = new Set(translations.spanishPosts);
const PAIRED = new Set(translations.pairs.flatMap((p) => [p.es, p.en]));

// The shell title. A prerendered post that still carries this got no head of
// its own, which is the exact failure the whole prerender step exists to avoid.
const SHELL_TITLE = 'Gabriel Abreu — Full Stack Developer | Code With Gabo';

const has = (haystack, needle) => haystack.includes(needle);
const read = (p) => readFileSync(p, 'utf8');

let slugs = [];

before(() => {
  if (!existsSync(BUILD)) {
    throw new Error('No build/ directory. Run `npm run build` first.');
  }
  slugs = readdirSync(BUILD, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'assets')
    .map((d) => d.name)
    .filter((name) => existsSync(join(BUILD, name, 'index.html')));
  assert.ok(slugs.length > 0, 'the build has no prerendered post directories');
});

// ── negative control for the whole suite ────────────────────────────────────
// Before trusting any assertion below, prove the suite can tell a real
// prerendered page from the SPA shell. If this fails, every passing test after
// it is meaningless, because the thing they distinguish does not distinguish.
test('control: the shell is recognisably different from a prerendered post', () => {
  const shell = read(join(BUILD, 'index.html'));
  assert.ok(has(shell, SHELL_TITLE), 'the shell no longer carries the shell title');
  assert.ok(
    !has(shell, '<link rel="canonical" href="' + ORIGIN + '/'),
    'the shell now carries a per-page canonical, so title is no longer a discriminator'
  );

  const post = read(join(BUILD, slugs[0], 'index.html'));
  assert.ok(!has(post, SHELL_TITLE), `${slugs[0]} still carries the shell title`);
});

// ── surface 1: the response body ────────────────────────────────────────────
test('every prerendered post has its own title and a clean self-canonical', () => {
  for (const slug of slugs) {
    const html = read(join(BUILD, slug, 'index.html'));

    const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
    assert.ok(title, `${slug}: no <title>`);
    assert.notEqual(title, SHELL_TITLE, `${slug}: serving the shell title`);

    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    assert.equal(canonical, `${ORIGIN}/${slug}`, `${slug}: wrong canonical`);
    assert.ok(!canonical.includes('?'), `${slug}: canonical carries a query string`);
  }
});

test('every prerendered post declares its own language', () => {
  for (const slug of slugs) {
    const html = read(join(BUILD, slug, 'index.html'));
    const lang = html.match(/<html[^>]*\slang="([^"]*)"/)?.[1];
    const expected = SPANISH.has(slug) ? 'es' : 'en';
    assert.equal(lang, expected, `${slug}: lang="${lang}", expected "${expected}"`);
  }
});

test('no content page carries noindex', () => {
  for (const slug of slugs) {
    const html = read(join(BUILD, slug, 'index.html'));
    const robots = html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? '';
    assert.ok(!robots.includes('noindex'), `${slug}: robots says "${robots}"`);
  }
});

// ── surface 1b: hreflang, with the doppelganger control ─────────────────────
// The bug this replaces: grepping for "alternate" found the feed and read as
// proof. These assertions match on hreflang specifically, and then assert that
// the feed link exists and was not the thing they counted.
const HREFLANG = /<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g;
const FEED_ALTERNATE = '<link rel="alternate" type="application/rss+xml"';

test('paired posts carry exactly three hreflang links, unpaired carry none', () => {
  for (const slug of slugs) {
    const html = read(join(BUILD, slug, 'index.html'));
    const found = [...html.matchAll(HREFLANG)].map((m) => m[1]);
    const expected = PAIRED.has(slug) ? ['es', 'en', 'x-default'] : [];
    assert.deepEqual(
      found.sort(),
      [...expected].sort(),
      `${slug}: hreflang ${JSON.stringify(found)}, expected ${JSON.stringify(expected)}`
    );
  }
});

test('doppelganger: the feed alternate is present and is not counted as hreflang', () => {
  for (const slug of slugs) {
    const html = read(join(BUILD, slug, 'index.html'));

    // The neighbour exists. If this ever fails the feed link was dropped, which
    // is its own bug and would also make the negative control below vacuous.
    assert.ok(has(html, FEED_ALTERNATE), `${slug}: the RSS alternate is missing`);

    // The neighbour is not what the hreflang matcher matches.
    const feedLine = html.match(/<link rel="alternate" type="application\/rss\+xml"[^>]*>/)[0];
    assert.ok(
      !HREFLANG.test(feedLine),
      `${slug}: the hreflang pattern matches the feed link — the two are indistinguishable`
    );
    HREFLANG.lastIndex = 0; // the regex is /g; .test advances it
  }
});

test('every hreflang target is a page that actually exists in the build', () => {
  for (const slug of slugs) {
    const html = read(join(BUILD, slug, 'index.html'));
    for (const [, , href] of html.matchAll(HREFLANG)) {
      const target = href.replace(`${ORIGIN}/`, '');
      assert.ok(
        existsSync(join(BUILD, target, 'index.html')),
        `${slug}: hreflang points at /${target}, which has no prerendered page`
      );
    }
  }
});

// ── surface 2: the sitemap ──────────────────────────────────────────────────
test('the sitemap is XML and lists every prerendered post exactly once', () => {
  const xml = read(join(BUILD, 'sitemap.xml'));
  assert.ok(xml.startsWith('<?xml'), 'sitemap.xml is not XML');

  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.equal(new Set(locs).size, locs.length, 'the sitemap has duplicate <loc> entries');

  for (const slug of slugs) {
    assert.ok(
      locs.includes(`${ORIGIN}/${slug}`),
      `${slug} is prerendered but missing from the sitemap`
    );
  }
});

// ── surface 3: the feed ─────────────────────────────────────────────────────
test('the feed is XML, carries full bodies, and its links are untagged', () => {
  const xml = read(join(BUILD, 'rss.xml'));
  assert.ok(xml.startsWith('<?xml'), 'rss.xml is not XML');
  assert.ok(has(xml, '<content:encoded>'), 'the feed ships teasers, not full bodies');

  const links = [...xml.matchAll(/<link>([^<]+)<\/link>/g)].map((m) => m[1]);
  for (const link of links) {
    assert.ok(!link.includes('utm_'), `feed link carries a campaign tag: ${link}`);
  }
});

// ── surface 4: response headers ─────────────────────────────────────────────
// These are configuration, not output, so the assertion is against the config
// that produces them. A header that only exists in production is a header no
// build-time check can see.
test('private routes are configured noindex and content routes are not', () => {
  const vercel = JSON.parse(read(join(ROOT, 'vercel.json')));
  const noindexRules = (vercel.headers ?? []).filter((rule) =>
    rule.headers.some((h) => h.key === 'X-Robots-Tag' && h.value.includes('noindex'))
  );
  assert.ok(noindexRules.length > 0, 'nothing is configured noindex');

  for (const priv of ['admin', 'dashboard', 'para-ti', 'admin-login']) {
    assert.ok(
      noindexRules.some((rule) => rule.source.includes(priv)),
      `/${priv} is not covered by a noindex rule`
    );
  }

  // The mirror of the same check: no noindex rule may match a bare path, which
  // is how such a rule leaks onto every page on the site.
  for (const rule of noindexRules) {
    assert.notEqual(rule.source, '/(.*)', 'a noindex rule matches every route');
  }
});

// ── surface 5: images ───────────────────────────────────────────────────────
// Not a surface a crawler reads, but the same class of mistake: the page
// requests bytes nothing in the build can see. 9.88 MB shipped this way.
test('no component renders a raw CMS image url', () => {
  const components = join(ROOT, 'src/components');
  const offenders = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.tsx$/.test(entry.name)) {
        const src = read(path);
        // Admin screens are excluded: the editor legitimately handles the raw
        // asset while uploading, before any transformation applies.
        if (path.includes('/Admin/')) continue;
        for (const m of src.matchAll(/(?:src|image)=\{([^}]*asset[^}]*url[^}]*)\}/g)) {
          if (!/sizedImage|socialImage|urlFor/.test(m[1])) {
            offenders.push(`${path.replace(ROOT + '/', '')}: ${m[1].trim()}`);
          }
        }
      }
    }
  };
  walk(components);
  assert.deepEqual(offenders, [], `raw CMS image urls:\n  ${offenders.join('\n  ')}`);
});

test('the served og:image is cropped to the card frame', () => {
  for (const slug of slugs) {
    const html = read(join(BUILD, slug, 'index.html'));
    const og = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    assert.ok(og, `${slug}: no og:image`);
    if (!og.includes('cdn.sanity.io')) continue; // the static fallback
    assert.ok(
      og.includes('fit=crop') && og.includes('w=1200') && og.includes('h=630'),
      `${slug}: og:image is not cropped to 1200x630 — whoever renders the card decides the framing`
    );
  }
});

// ── surface 6: what a consumer without JavaScript reads ─────────────────────
// Every page used to serve 46 characters — "You need to enable JavaScript to
// run this app." — and zero links. Google's own list of AdSense rejection
// reasons describes that shape twice, under insufficient content and under site
// navigation. The noscript block is the fix; these assertions are what keep it.
const textOf = (html) => {
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? '';
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

test('every page carries real text and real links without JavaScript', () => {
  const MIN_TEXT = 500;
  const MIN_LINKS = 3;
  const pages = [['', read(join(BUILD, 'index.html'))]].concat(
    slugs.map((s) => [s, read(join(BUILD, s, 'index.html'))])
  );
  for (const [name, html] of pages) {
    const text = textOf(html);
    assert.ok(
      !/^You need to enable JavaScript/.test(text),
      `/${name}: the whole body is still the JavaScript notice`
    );
    assert.ok(
      text.length >= MIN_TEXT,
      `/${name}: ${text.length} characters without JavaScript, want >= ${MIN_TEXT}`
    );
    const links = (html.match(/<a\s/g) ?? []).length;
    assert.ok(links >= MIN_LINKS, `/${name}: ${links} links without JavaScript`);
  }
});

test('the noscript content sits outside #root, so React never discards it', () => {
  for (const slug of slugs) {
    const html = read(join(BUILD, slug, 'index.html'));
    // createRoot replaces everything inside #root. Content placed in there
    // would vanish the moment the bundle runs, which is the failure this
    // assertion exists to prevent — it would still pass the test above.
    assert.ok(
      has(html, '<div id="root"></div>'),
      `${slug}: #root is not empty, so prerendered body markup would be discarded`
    );
    assert.ok(html.indexOf('<noscript>') < html.indexOf('<div id="root">'),
      `${slug}: the noscript block is not before #root`);
  }
});

