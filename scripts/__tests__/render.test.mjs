/**
 * What a browser that runs the bundle actually shows, against build/.
 *
 * WHY THIS FILE EXISTS: surfaces.test.mjs reads what is written to disk, and
 * that is the right surface for crawlers that do not execute JavaScript. Google
 * does execute it, and ignores <noscript>. So on 2026-09-29 Search Console
 * marked a real post as a Soft 404: Googlebot rendered the page eleven minutes
 * after a deploy, the Sanity fetch did not resolve in time, OnePost treated the
 * failure as "no such post" and wrote a 404 title and a noindex into the head.
 * The prerendered file on disk was perfect the whole time. No assertion over
 * build/ could have seen it.
 *
 * These tests serve build/ with vercel.json's semantics, open it in a real
 * Chrome over the DevTools Protocol, make every request to Sanity fail, and
 * read what the page says about itself once the bundle has run.
 *
 *   npm run build && npm test
 *
 * Requires Node >= 22 for the global WebSocket and a local Chrome; both are
 * skipped visibly, never silently. Scenarios that block Sanity need no network.
 * The one that asks for an unknown slug needs Sanity reachable: it is the
 * control that proves a real 404 still looks like one.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const BUILD = join(ROOT, 'build');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// Not a free choice. Sanity answers browser requests only from the origins
// registered on the project, and http://localhost:3000 is the one local origin
// on that list (the port this app ran on under Create React App). Serving the
// build from any other port makes every Sanity request fail CORS, which is a
// faithful reproduction of the bug and useless as a control: the "reachable"
// scenario needs Sanity to actually answer. CDP is distinct from
// capture-static.mjs (9335) and byte-budget.mjs (9333).
const HOST = 'localhost';
const PORT = 3000;
const CDP = 9337;
const ORIGIN = `http://${HOST}:${PORT}`;

// The covers are drawn at 1200x630 with the headline inside the image, and
// .post-related__img already frames them at this ratio.
const COVER_RATIO = 1200 / 630;

// A skipped test prints its reason. A test that silently passes because the
// browser never launched is the failure mode this guards against.
const SKIP =
  typeof WebSocket !== 'function'
    ? 'needs Node >= 22 (global WebSocket)'
    : !existsSync(CHROME)
      ? `needs Chrome at ${CHROME}`
      : !existsSync(BUILD)
        ? 'needs build/ (run `npm run build` first)'
        : false;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.ico': 'image/x-icon', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.xml': 'application/xml', '.txt': 'text/plain', '.pdf': 'application/pdf',
};

// ── the server: build/ with vercel.json's rewrite ───────────────────────────
// /assets/* is the file or a 404. Everything else is build/<path>/index.html
// when a prerendered page exists, the file itself when one exists, and the
// shell otherwise, always with a 200: that is what the catch-all rewrite does.
//
// `?shell=1` skips the prerendered file and answers with the shell, which is
// what a visitor gets for a post published after the last deploy, and what the
// failure scenario below needs.
const isFile = (f) => existsSync(f) && statSync(f).isFile();

function serveBuild(req, res) {
  const url = new URL(req.url, ORIGIN);
  const pathname = decodeURIComponent(url.pathname);
  const send = (file) => {
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  };

  if (pathname.startsWith('/assets/')) {
    const file = join(BUILD, pathname);
    if (isFile(file)) return send(file);
    res.writeHead(404);
    return res.end();
  }
  if (!url.searchParams.has('shell')) {
    const indexed = join(BUILD, pathname, 'index.html');
    if (isFile(indexed)) return send(indexed);
    const file = join(BUILD, pathname);
    if (isFile(file)) return send(file);
  }
  return send(join(BUILD, 'index.html'));
}

// ── Chrome over CDP, the house pattern from scripts/byte-budget.mjs ────────
let server;
let chrome;
let profile;

before(async () => {
  if (SKIP) return;
  server = createServer(serveBuild);
  await new Promise((res, rej) => {
    server.once('error', (err) =>
      rej(
        err.code === 'EADDRINUSE'
          ? new Error(
              `port ${PORT} is in use. Sanity's CORS list allows only ${ORIGIN} locally, so this test cannot move to another port; stop whatever holds it.`
            )
          : err
      )
    );
    server.listen(PORT, res);
  });

  profile = mkdtempSync(join(tmpdir(), 'render-test-'));
  chrome = spawn(CHROME, [
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${CDP}`,
    'about:blank',
  ]);
  let up = false;
  for (let i = 0; i < 50 && !up; i++) {
    try {
      await (await fetch(`http://127.0.0.1:${CDP}/json/version`)).json();
      up = true;
    } catch {
      await sleep(200);
    }
  }
  if (!up) throw new Error(`Chrome did not answer on port ${CDP} within 10 s`);
});

after(async () => {
  // Always: a Chrome left behind holds the port and the next run fails for a
  // reason that has nothing to do with the code under test.
  if (chrome) {
    const exited = new Promise((r) => chrome.once('exit', r));
    chrome.kill();
    await Promise.race([exited, sleep(3000)]);
  }
  if (profile) {
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
  if (server) await new Promise((r) => server.close(r));
});

async function cdp(url) {
  const ws = new WebSocket(url);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) rej(new Error(`CDP ${msg.error.code}: ${msg.error.message}`));
      else res(msg.result);
    } else if (msg.method) {
      for (const fn of listeners) fn(msg);
    }
  };
  return {
    send: (method, params = {}) =>
      new Promise((res, rej) => {
        const myId = ++id;
        pending.set(myId, { res, rej });
        ws.send(JSON.stringify({ id: myId, method, params }));
      }),
    on: (fn) => listeners.push(fn),
    close: () => ws.close(),
  };
}

// Third parties that make a run slow and non-deterministic. Not what is under
// test, and a page that waits on AdSense is a page whose timing is Google's.
const ALWAYS_BLOCKED = ['*googlesyndication*', '*googletagmanager*', '*doubleclick*'];
const SANITY = '*sanity.io*';

const PHONE = { width: 412, height: 732, deviceScaleFactor: 2.625, mobile: true };

// The Sanity client sends every GROQ query to <project>.api(cdn).sanity.io/
// v<date>/data/query/<dataset>. Image requests go to cdn.sanity.io and are not
// queries; they are never retried and never answered by OnePost's effects.
const isSanity = (url) => url.includes('sanity.io');
const isSanityQuery = (url) => isSanity(url) && url.includes('/data/query/');

// A fresh tab per scenario. Returns a handle with evaluate/close; every request
// matching a blocked pattern fails at the network layer, before any response,
// which is what an unreachable Sanity looks like to the fetch in OnePost.
//
// Sanity is intercepted whether or not it is blocked. A blocked run fails the
// request and records the attempt (see sanityGaveUp); a reachable run lets it
// through, or holds it while a scenario needs the answer not to have arrived
// yet (see holdSanity).
async function open(route, { blockSanity = true, viewport = null, init = null } = {}) {
  const target = await (
    await fetch(`http://127.0.0.1:${CDP}/json/new?about:blank`, { method: 'PUT' })
  ).json();
  const client = await cdp(target.webSocketDebuggerUrl);

  const patterns = [...ALWAYS_BLOCKED, SANITY].map((urlPattern) => ({ urlPattern }));
  const sanity = { attempts: [], held: [], holding: false };
  client.on(({ method, params }) => {
    if (method !== 'Fetch.requestPaused') return;
    const { requestId, request } = params;
    if (isSanity(request.url) && !blockSanity) {
      if (sanity.holding && isSanityQuery(request.url)) {
        sanity.held.push(requestId);
        return;
      }
      client.send('Fetch.continueRequest', { requestId }).catch(() => {});
      return;
    }
    if (isSanityQuery(request.url)) sanity.attempts.push(Date.now());
    client
      .send('Fetch.failRequest', { requestId, errorReason: 'ConnectionRefused' })
      .catch(() => {});
  });
  await client.send('Fetch.enable', { patterns });
  await client.send('Network.enable');
  await client.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (viewport) await client.send('Emulation.setDeviceMetricsOverride', viewport);
  await client.send('Page.enable');
  // `init` runs in the new document before any of the page's own scripts: the
  // way to put state where the app will find it from its first line, rather
  // than racing its effects from outside.
  if (init) await client.send('Page.addScriptToEvaluateOnNewDocument', { source: init });
  await client.send('Page.navigate', { url: `${ORIGIN}${route}` });

  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await client.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      throw new Error(
        `in page: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`
      );
    }
    return result.value;
  };

  // Polls until the expression is truthy. The failure message carries the
  // title, because "did not appear" on its own hides the one fact that
  // explains it: the page decided it was a 404.
  const waitFor = async (expression, what, timeoutMs) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const value = await evaluate(expression);
      if (value) return value;
      await sleep(100);
    }
    const title = await evaluate('document.title');
    const robots = await evaluate(
      `document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? ''`
    );
    throw new Error(
      `${what} did not appear within ${timeoutMs} ms on ${route} ` +
        `(document.title is "${title}", robots is "${robots}")`
    );
  };

  // Resolves once the Sanity client has stopped retrying, with the number of
  // query attempts it made. A failed request is not a failed fetch: get-it
  // retries a GET that died on the network five times, backing off
  // 100 * 2^n ms plus jitter, so the promise OnePost awaits rejects some
  // 3.5 to 4 s after the first attempt, and only then does its catch run. A
  // scenario that reads the page before that has observed the first render
  // and nothing about what the failure does to it. The signal is one the page
  // cannot fake: no new query attempt for longer than the longest gap in the
  // backoff (about 1.7 s).
  const sanityGaveUp = async ({ quietMs = 2500, timeoutMs = 10_000 } = {}) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const last = sanity.attempts.at(-1);
      if (last && Date.now() - last >= quietMs) return sanity.attempts.length;
      await sleep(100);
    }
    const last = sanity.attempts.at(-1);
    throw new Error(
      `Sanity did not give up within ${timeoutMs} ms on ${route}: ` +
        `${sanity.attempts.length} query attempts` +
        (last ? `, the last ${Date.now() - last} ms ago` : '')
    );
  };

  // From now on every Sanity query is held, not answered, so a scenario can
  // look at what the page shows while an answer is on its way for as long as
  // the assertion needs, rather than for one round trip to Sanity's CDN.
  // Reachable runs only; a blocked run fails the request instead.
  const holdSanity = () => {
    sanity.holding = true;
  };
  // Polls until at least one query is held. The effects that issue them run
  // after the commit a scenario has just waited for, so the request shows up
  // a beat later than the DOM does.
  const heldSanity = async (timeoutMs = 5000) => {
    const deadline = Date.now() + timeoutMs;
    while (sanity.held.length === 0 && Date.now() < deadline) await sleep(50);
    return sanity.held.length;
  };
  const releaseSanity = async () => {
    sanity.holding = false;
    const ids = sanity.held.splice(0);
    await Promise.all(
      ids.map((requestId) =>
        client.send('Fetch.continueRequest', { requestId }).catch(() => {})
      )
    );
    return ids.length;
  };

  const close = async () => {
    client.close();
    await fetch(`http://127.0.0.1:${CDP}/json/close/${target.id}`);
  };

  // The same page at another size, without a reload: what a rule that depends
  // on the viewport does when the viewport changes under it.
  const setViewport = (metrics) => client.send('Emulation.setDeviceMetricsOverride', metrics);

  return {
    evaluate,
    waitFor,
    close,
    sanityGaveUp,
    holdSanity,
    heldSanity,
    releaseSanity,
    setViewport,
  };
}

const head = async (page) => ({
  title: await page.evaluate('document.title'),
  robots: await page.evaluate(
    `document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? ''`
  ),
});

// ── the post under test ─────────────────────────────────────────────────────
// Read from the build, not hardcoded: a slug written into this file is a slug
// that goes stale the day the post is renamed. The embedded data is both the
// selector (it needs a cover) and the expectation (its title is what the page
// must show).
const DATA_SCRIPT = /<script id="post-data" type="application\/json">([\s\S]*?)<\/script>/;

function pickPost() {
  const candidates = readdirSync(BUILD, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== 'assets')
    .map((d) => d.name)
    .filter((slug) => isFile(join(BUILD, slug, 'index.html')));
  for (const slug of candidates) {
    const html = readFileSync(join(BUILD, slug, 'index.html'), 'utf8');
    const raw = html.match(DATA_SCRIPT)?.[1];
    if (!raw) continue;
    const embedded = JSON.parse(raw);
    if (!embedded?.mainImage?.asset?.url) continue;
    const bakedTitle = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
    return { slug, embedded, bakedTitle };
  }
  throw new Error(
    `no prerendered post in build/ embeds its data with a mainImage (${candidates.length} pages checked)`
  );
}

// ── scenarios ───────────────────────────────────────────────────────────────

test(
  'Sanity unreachable: a prerendered post renders from its embedded data',
  { skip: SKIP, timeout: 60_000 },
  async () => {
    // The Soft 404 itself. Every request to Sanity fails; the page must still
    // be the article, with the head the prerender baked, not a 404.
    const { slug, embedded, bakedTitle } = pickPost();
    const page = await open(`/${slug}`, { blockSanity: true });
    const H1 = `document.querySelector('h1.post-title')?.textContent ?? ''`;
    try {
      await page.waitFor(H1, 'h1.post-title', 8000);
      // That h1 is the first render, from the embedded data, and it appears
      // some 3 s before the fetch has failed: the client retries the whole
      // time, and OnePost's catch runs only when it gives up. Everything
      // below is read after that, or none of it says what the failure does
      // to the page. Checked by mutation: with the embedded fallback deleted
      // from the catch, the article gives way to the "could not load" view at
      // about 4 s, and a read at 1 s is green.
      await page.sanityGaveUp();

      const h1 = await page.evaluate(H1);
      assert.equal(h1, embedded.title, 'h1.post-title is not the embedded title once the fetch has failed');
      assert.equal(
        await page.evaluate(`!!document.querySelector('.post-unavailable__retry')`),
        false,
        'the failed fetch replaced the article with the "could not load" view, embedded copy and all'
      );
      const { title, robots } = await head(page);
      assert.ok(!title.includes('404'), `the page calls itself a 404: "${title}"`);
      assert.equal(title, bakedTitle, 'document.title is not the title the prerender baked');
      assert.ok(!robots.includes('noindex'), `robots says "${robots}"`);

      const bodyLength = await page.evaluate(
        `(document.querySelector('.post-content')?.innerText ?? '').length`
      );
      assert.ok(bodyLength > 200, `.post-content is ${bodyLength} characters of text`);
    } finally {
      await page.close();
    }
  }
);

test(
  'Sanity reachable: an unknown slug is still a 404 with noindex',
  { skip: SKIP, timeout: 60_000 },
  async () => {
    // The control. Telling "failed" from "missing" must not soften the real
    // 404, and the only thing that proves a slug is missing is Sanity's empty
    // answer, so this one needs the network.
    const page = await open('/this-slug-does-not-exist-xyz', { blockSanity: false });
    try {
      const title = await page.waitFor(
        `document.title.includes('404') ? document.title : ''`,
        'a 404 title',
        15000
      );
      const { robots } = await head(page);
      assert.ok(title.includes('404'), `title is "${title}"`);
      assert.equal(robots, 'noindex, nofollow', `robots says "${robots}"`);
    } finally {
      await page.close();
    }
  }
);

test(
  'Sanity reachable: going back to the prerendered post shows no cards from the post left behind',
  { skip: SKIP, timeout: 60_000 },
  async () => {
    // /:slug renders one <OnePost /> with no key, so A -> B -> Back reuses the
    // instance, and the document still carries A's embedded data. A paints at
    // once from it, before its own related query has left the browser, and
    // the "Sigue leyendo" block under it must be empty until that query
    // answers: not B's three cards, one of which can be A itself. The query
    // is held so the window lasts as long as the assertion needs.
    const { slug, embedded } = pickPost();
    const page = await open(`/${slug}`, { blockSanity: false });
    const CARDS = `JSON.stringify([...document.querySelectorAll('.post-related__card')].map((a) => a.getAttribute('href')))`;
    // The cards as JSON once `condition` (over the JSON string `cards`) holds.
    const cardsWhen = (condition) =>
      `(() => { const cards = ${CARDS}; return (${condition}) ? cards : ''; })()`;
    try {
      const first = JSON.parse(
        await page.waitFor(cardsWhen(`cards !== '[]'`), `the related cards of /${slug}`, 15000)
      );
      await page.evaluate(`document.querySelector('.post-related__card').click()`);
      // B's list can never equal A's: A's holds B, B's cannot.
      await page.waitFor(
        cardsWhen(`cards !== '[]' && cards !== ${JSON.stringify(JSON.stringify(first))}`),
        `the related cards of ${first[0]}`,
        15000
      );
      assert.equal(
        await page.evaluate('location.pathname'),
        first[0],
        'harness: clicking the first card did not navigate to it'
      );

      page.holdSanity();
      await page.evaluate('history.back()');
      await page.waitFor(
        `document.querySelector('h1.post-title')?.textContent === ${JSON.stringify(embedded.title)} ? 'yes' : ''`,
        `the h1 of /${slug} after going back`,
        8000
      );
      assert.ok(
        (await page.heldSanity()) > 0,
        'harness: no Sanity query was held after going back, so the page may already have its own answer'
      );
      const shown = JSON.parse(await page.evaluate(CARDS));
      assert.deepEqual(
        shown,
        [],
        `under /${slug}, with its own related query unanswered, the page shows the cards of ${first[0]}: ${shown.join(', ')}`
      );

      await page.releaseSanity();
      const again = JSON.parse(
        await page.waitFor(
          cardsWhen(`cards !== '[]'`),
          `the related cards of /${slug} once Sanity answers`,
          15000
        )
      );
      assert.deepEqual(again, first, "harness: releasing Sanity did not bring back the first post's own cards");
    } finally {
      await page.close();
    }
  }
);

test(
  'Sanity unreachable and no embedded data: a failure, not a 404',
  { skip: SKIP, timeout: 60_000 },
  async () => {
    // The shell for a real slug is what a visitor gets for a post published
    // after the last deploy. With nothing to render from and nothing coming
    // back, the honest answer is "could not load", and the head is left alone:
    // no 404 title, no noindex, a way to try again.
    const { slug } = pickPost();
    const page = await open(`/${slug}?shell=1`, { blockSanity: true });
    try {
      await page.waitFor(
        `!!document.querySelector('.post-unavailable__retry')`,
        'the retry control (.post-unavailable__retry)',
        15000
      );
      // Harness check: the server really did answer with the shell.
      const embeddedInDom = await page.evaluate(`!!document.getElementById('post-data')`);
      assert.equal(embeddedInDom, false, '?shell=1 served the prerendered page, not the shell');

      const { title, robots } = await head(page);
      assert.ok(!title.includes('404'), `the page calls itself a 404: "${title}"`);
      assert.ok(!robots.includes('noindex'), `robots says "${robots}"`);
    } finally {
      await page.close();
    }
  }
);

test(
  'cover keeps its 1200x630 frame on a phone',
  { skip: SKIP, timeout: 60_000 },
  async () => {
    // Google's smartphone render of /chrome-ya-trae-un-modelo-adentro showed
    // the headline cut to "ome ya trae / modelo adentro": the cover was forced
    // into a 300px-tall box and object-fit: cover cropped the sides off.
    const { slug } = pickPost();
    const page = await open(`/${slug}`, { blockSanity: true, viewport: PHONE });
    try {
      await page.waitFor(
        `(() => { const r = document.querySelector('img.post-main-image')?.getBoundingClientRect(); return r && r.width > 0; })()`,
        'img.post-main-image',
        8000
      );
      const { width, height } = await page.evaluate(
        `(() => { const r = document.querySelector('img.post-main-image').getBoundingClientRect(); return { width: r.width, height: r.height }; })()`
      );
      assert.ok(width > 300, `cover is ${width}px wide on a 412px viewport`);
      const ratio = width / height;
      assert.ok(
        Math.abs(ratio - COVER_RATIO) <= 0.03,
        `cover box is ${width}x${height} (ratio ${ratio.toFixed(3)}), expected ${COVER_RATIO.toFixed(3)} +/- 0.03`
      );
    } finally {
      await page.close();
    }
  }
);

// ── the install prompt ──────────────────────────────────────────────────────
// InstallPWA listens for Chrome's beforeinstallprompt and, five seconds later,
// slides a card up from the bottom of the screen. Three things were wrong
// with it:
//
//   1. The card was centred with `left: 50%; transform: translateX(-50%)`, and
//      motion animates `y` by writing its own inline `transform`. The inline
//      one won, the translateX was gone, and the card started at the middle of
//      the screen and ran off its right edge: on a 412px phone it covered the
//      title of the post and half of it could not be reached.
//
//   2. The X stored the moment of the dismissal "for 7 days", and the only
//      code that read it back ran once, on mount, to set a flag that was
//      already false. The timer then showed the card anyway. Closing it bought
//      one page load.
//
//   3. Every offer starts its own five-second timer, and a timer that was
//      already running when the visitor closed the card opened it again. That
//      one was found by these tests misbehaving: Chrome's own event lands
//      100 to 700 ms after load, next to the one a test dispatches, so there
//      were two timers, and the card came back 50 to 400 ms after the X.
//
// The five seconds are the component's own, so each scenario that needs the
// card pays them.
//
// Chrome fires the real event by itself on some loads, early, before a test
// can do anything to the page. So whatever a scenario needs in localStorage
// goes in through `init`, before the app's first line. Setting it afterwards
// looked equivalent and was not: the "older than a week" control wrote its
// eight-day-old dismissal after mount, Chrome's own event had already been
// heard with nothing stored, and the card came up on that event's timer. The
// control passed with the expiry deleted from the component. It was measuring
// who got to the listener first.
const INSTALL = '.install-pwa-container';
const DISMISSED_KEY = 'pwa-install-dismissed';
// The opening about:blank has an opaque origin, where touching localStorage
// throws; the script runs there too.
const storeDismissal = (value) =>
  `try { ${
    value === null
      ? `localStorage.removeItem('${DISMISSED_KEY}')`
      : `localStorage.setItem('${DISMISSED_KEY}', '${value}')`
  }; } catch {}`;
const DESKTOP = { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false };
const MOUNTED = `!!document.getElementById('main-content')`;

// Dispatches the event the component waits for, and says whether anyone heard
// it. preventDefault() is the first thing the component's listener does, so a
// prevented event proves its effect has run, and polling this until it is true
// delivers exactly one event to it: the earlier ones had no listener.
const OFFER_INSTALL = `(() => {
  const e = new Event('beforeinstallprompt', { cancelable: true });
  window.dispatchEvent(e);
  return e.defaultPrevented;
})()`;

// The card's box as JSON once it has stopped moving on a viewport at least
// `minWidth` wide: two reads in a row that agree, at full opacity. The spring
// that slides it in is still travelling for a while after the node exists.
const installBoxAtRest = (minWidth) => `(() => {
  const el = document.querySelector('${INSTALL}');
  const viewportWidth = document.documentElement.clientWidth;
  if (!el || viewportWidth < ${minWidth}) return '';
  const r = el.getBoundingClientRect();
  const round = (n) => Math.round(n * 10) / 10;
  const box = JSON.stringify({
    left: round(r.left),
    right: round(r.right),
    top: round(r.top),
    bottom: round(r.bottom),
    viewportWidth,
    viewportHeight: window.innerHeight,
  });
  const still = window.__installBox === box && getComputedStyle(el).opacity === '1';
  window.__installBox = box;
  return still ? box : '';
})()`;

function assertInsideAndCentred(box, where) {
  const span = `it spans ${box.left}px to ${box.right}px of a ${box.viewportWidth}px viewport`;
  assert.ok(
    box.left >= 0 && box.right <= box.viewportWidth,
    `on ${where} the install prompt runs off the screen: ${span}`
  );
  const offCentre = (box.left + box.right) / 2 - box.viewportWidth / 2;
  assert.ok(
    Math.abs(offCentre) <= 1,
    `on ${where} the install prompt is ${offCentre}px off centre: ${span}`
  );
  assert.ok(
    box.top >= 0 && box.bottom <= box.viewportHeight,
    `on ${where} the install prompt is not fully on screen vertically: ` +
      `${box.top}px to ${box.bottom}px of ${box.viewportHeight}px`
  );
}

test(
  'the install prompt sits inside the viewport and centred, on a phone and on a desktop',
  { skip: SKIP, timeout: 60_000 },
  async () => {
    const page = await open('/about', {
      blockSanity: true,
      viewport: PHONE,
      init: storeDismissal(null),
    });
    try {
      await page.waitFor(MOUNTED, 'the app', 8000);
      await page.waitFor(OFFER_INSTALL, 'a listener for beforeinstallprompt', 8000);

      const phone = JSON.parse(
        await page.waitFor(installBoxAtRest(0), 'the install prompt at rest on a phone', 9000)
      );
      assert.equal(phone.viewportWidth, PHONE.width, 'harness: the phone viewport did not apply');
      assertInsideAndCentred(phone, `a ${PHONE.width}px phone`);

      // Same card, same page, a wide screen: the centring must not be a
      // property of one breakpoint.
      await page.setViewport(DESKTOP);
      const desktop = JSON.parse(
        await page.waitFor(installBoxAtRest(1000), 'the install prompt at rest on a desktop', 5000)
      );
      assertInsideAndCentred(desktop, `a ${DESKTOP.width}px desktop`);
      const width = desktop.right - desktop.left;
      assert.ok(width <= 600.5, `on a desktop the install prompt is ${width}px wide, over its 600px cap`);
    } finally {
      await page.evaluate(`localStorage.removeItem('${DISMISSED_KEY}')`).catch(() => {});
      await page.close();
    }
  }
);

test(
  'a closed install prompt stays closed when another offer was already on its way',
  { skip: SKIP, timeout: 60_000 },
  async () => {
    const page = await open('/about', {
      blockSanity: true,
      viewport: PHONE,
      init: storeDismissal(null),
    });
    try {
      await page.waitFor(MOUNTED, 'the app', 8000);
      await page.waitFor(OFFER_INSTALL, 'a listener for beforeinstallprompt', 8000);
      // A second offer, a second timer, due 1.5 s after the first. Not left to
      // Chrome's own event, which arrives when it likes.
      await sleep(1500);
      assert.equal(
        await page.evaluate(OFFER_INSTALL),
        true,
        'harness: the second offer was not heard'
      );

      await page.waitFor(`!!document.querySelector('${INSTALL}')`, 'the install prompt', 9000);
      await page.evaluate(`document.querySelector('${INSTALL} .dismiss-btn').click()`);
      const closedAt = Date.now();
      // The second timer is due about 1.5 s from now. Watch well past it.
      while (Date.now() - closedAt < 3500) {
        const shown = await page.evaluate(`!!document.querySelector('${INSTALL}')`);
        assert.equal(
          shown,
          false,
          `the install prompt was back on screen ${Date.now() - closedAt} ms after the visitor closed it`
        );
        await sleep(100);
      }
    } finally {
      await page.evaluate(`localStorage.removeItem('${DISMISSED_KEY}')`).catch(() => {});
      await page.close();
    }
  }
);

test(
  'a dismissed install prompt does not come back on the next visit',
  { skip: SKIP, timeout: 60_000 },
  async () => {
    const first = await open('/about', {
      blockSanity: true,
      viewport: PHONE,
      init: storeDismissal(null),
    });
    let next;
    try {
      await first.waitFor(MOUNTED, 'the app', 8000);
      await first.waitFor(OFFER_INSTALL, 'a listener for beforeinstallprompt', 8000);
      await first.waitFor(`!!document.querySelector('${INSTALL}')`, 'the install prompt', 9000);

      // Whether the card then stays closed on this page is the test above.
      // What this one takes from the click is what it left in storage.
      await first.evaluate(`document.querySelector('${INSTALL} .dismiss-btn').click()`);
      const storedAt = Number(await first.evaluate(`localStorage.getItem('${DISMISSED_KEY}')`));
      assert.ok(
        storedAt > Date.now() - 60_000,
        `harness: the X did not record the dismissal (stored "${storedAt}")`
      );

      // The next visit, in a new tab of the same browser, with no `init`:
      // what is stored is what the X stored. The event arrives, the listener
      // hears it, and for longer than the component's five seconds nothing
      // may slide up.
      next = await open('/about', { blockSanity: true, viewport: PHONE });
      await next.waitFor(MOUNTED, 'the app', 8000);
      await next.waitFor(OFFER_INSTALL, 'a listener for beforeinstallprompt', 8000);
      const heardAt = Date.now();
      while (Date.now() - heardAt < 6500) {
        const shown = await next.evaluate(`!!document.querySelector('${INSTALL}')`);
        assert.equal(
          shown,
          false,
          `the install prompt came back ${Date.now() - heardAt} ms into the next visit, ` +
            `${Math.round((Date.now() - storedAt) / 1000)} s after the visitor closed it`
        );
        await sleep(250);
      }
    } finally {
      await first.evaluate(`localStorage.removeItem('${DISMISSED_KEY}')`).catch(() => {});
      await first.close();
      if (next) await next.close();
    }
  }
);

test(
  'a dismissal older than a week no longer hides the install prompt',
  { skip: SKIP, timeout: 60_000 },
  async () => {
    // The control for the test above: "dismissed" must expire, or closing the
    // card once would hide it for good.
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const page = await open('/about', {
      blockSanity: true,
      viewport: PHONE,
      init: storeDismissal(eightDaysAgo),
    });
    try {
      await page.waitFor(MOUNTED, 'the app', 8000);
      assert.equal(
        Number(await page.evaluate(`localStorage.getItem('${DISMISSED_KEY}')`)),
        eightDaysAgo,
        'harness: the eight-day-old dismissal is not what the page found in storage'
      );
      await page.waitFor(OFFER_INSTALL, 'a listener for beforeinstallprompt', 8000);
      await page.waitFor(
        `!!document.querySelector('${INSTALL}')`,
        'the install prompt, eight days after it was dismissed',
        9000
      );
    } finally {
      await page.evaluate(`localStorage.removeItem('${DISMISSED_KEY}')`).catch(() => {});
      await page.close();
    }
  }
);
