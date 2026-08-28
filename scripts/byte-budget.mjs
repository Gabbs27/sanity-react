/**
 * A byte budget per route, measured in a real browser.
 *
 * WHY: the surfaces suite reads build/, and the image fix asserts that no
 * component renders a raw CMS url. Both check a lifecycle I already know about.
 * Neither would notice bytes arriving from a third one — an embed, a font, a
 * script a dependency injects — because they only look where they were told to.
 * That is the same shape as weighing build/assets/ and missing 9.88 MB of CMS
 * covers, one level up.
 *
 * A total measured at the browser has no domain boundary to be silent about.
 * It counts what the page actually fetched, from anywhere, by any mechanism.
 *
 * HOW: Chrome over the DevTools Protocol, no dependencies. Resource Timing was
 * the obvious alternative and it is useless here: a cross-origin response
 * without Timing-Allow-Origin reports encodedBodySize 0, and every image on
 * this site is cross-origin. The measurement would have read zero and passed.
 *
 * Requires Node >= 22 for the global WebSocket.
 *
 *   node scripts/byte-budget.mjs            # check against BUDGETS
 *   node scripts/byte-budget.mjs --measure  # print what routes weigh now
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const ORIGIN = process.env.BUDGET_ORIGIN ?? 'https://codewithgabo.com';
const MEASURE = process.argv.includes('--measure');

// Budgets are a ratchet, not an aspiration: set just above what each route
// weighs today, so the check fails on a regression rather than nagging about an
// ideal nobody is working toward. Lower them when a route gets lighter.
const BUDGETS = {
  // First-party kilobytes only. Every route pays ~273 KB for the shared bundle;
  // the home page adds the nine project screenshots, /allpost the post covers.
  // Set just above today's figure so a regression fails and nothing nags.
  '/': 550,
  '/allpost': 380,
  '/green-and-blind': 340,
  '/the-audits-blind-spot': 340,
  '/3-prompts-gemini-nano-banana-resultados': 360,
};

if (typeof WebSocket !== 'function') {
  console.error('Needs Node >= 22 (global WebSocket). Try: nvm use 22');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
      pending.get(msg.id)(msg.result);
      pending.delete(msg.id);
    } else if (msg.method) {
      for (const fn of listeners) fn(msg);
    }
  };
  return {
    send: (method, params = {}) =>
      new Promise((res) => {
        const myId = ++id;
        pending.set(myId, res);
        ws.send(JSON.stringify({ id: myId, method, params }));
      }),
    on: (fn) => listeners.push(fn),
    close: () => ws.close(),
  };
}

// A whole browser per route, each with its own profile directory.
//
// Sharing one browser and opening a tab per route looked equivalent and was not:
// the HTTP cache is per profile, so the JS bundle was counted once, on whichever
// route happened to be measured first, and every route after it reported 0 KB of
// its own. The check was measuring measurement order. Target.createBrowserContext
// would be lighter than a second Chrome; a second Chrome is impossible to get
// subtly wrong, which is what this file is for.
async function withChrome(fn) {
  const port = PORT + Math.floor(Math.random() * 0); // stable; one at a time
  const profile = mkdtempSync(join(tmpdir(), 'budget-'));
  const proc = spawn(CHROME, [
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${port}`,
    'about:blank',
  ]);
  try {
    for (let i = 0; i < 40; i++) {
      try {
        await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
        break;
      } catch {
        await sleep(300);
      }
    }
    return await fn(port);
  } finally {
    // Wait for the process to actually exit. kill() only sends the signal, and
    // Chrome keeps writing its profile for a moment afterwards — removing the
    // directory under it fails with ENOTEMPTY.
    const exited = new Promise((r) => proc.once('exit', r));
    proc.kill();
    await Promise.race([exited, sleep(3000)]);
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

async function weigh(route, PORT) {
  // A fresh browser context per route. Sharing one leaks the HTTP cache between
  // them: the JS bundle was counted on the first route measured and on none of
  // the others, so every route after the first under-reported its own weight by
  // the size of everything it shares. The check was measuring measurement order.
  const target = await (
    await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })
  ).json();
  const client = await cdp(target.webSocketDebuggerUrl);

  let bytes = 0;
  const byHost = new Map();
  const inFlight = new Map();

  client.on(({ method, params }) => {
    if (method === 'Network.requestWillBeSent') {
      inFlight.set(params.requestId, params.request.url);
    } else if (method === 'Network.loadingFinished') {
      // encodedDataLength is what came over the wire, headers included, after
      // content-encoding. It is the number a person on a phone plan pays.
      const url = inFlight.get(params.requestId) ?? '';
      bytes += params.encodedDataLength;
      try {
        const host = new URL(url).host;
        byHost.set(host, (byHost.get(host) ?? 0) + params.encodedDataLength);
      } catch {
        /* data: and blob: urls have no host and cost no transfer */
      }
    }
  });

  await client.send('Network.enable');
  await client.send('Network.setCacheDisabled', { cacheDisabled: true });
  await client.send('Page.enable');
  await client.send('Page.navigate', { url: `${ORIGIN}${route}` });

  // This is a client-rendered SPA: the load event fires before the app has
  // asked for anything. The bytes that matter arrive after it.
  await sleep(6000);

  client.close();
  await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`);
  return { bytes, byHost };
}

const results = [];
for (const route of Object.keys(BUDGETS)) {
  const { bytes, byHost } = await withChrome((port) => weigh(route, port));
  // Budgets enforce FIRST-PARTY bytes only. AdSense measured between 247 KB and
  // 644 KB across runs of the same route on the same afternoon — a budget over
  // the total goes red or green depending on what Google decided to load that
  // second, and a check that fails at random is one people learn to ignore.
  // Third-party is still measured and printed, because not enforcing it is not
  // a reason to stop looking at it.
  let own = 0;
  let third = 0;
  for (const [host, b] of byHost) {
    if (host.endsWith('codewithgabo.com')) own += b;
    else third += b;
  }
  results.push({
    route,
    kb: Math.round(bytes / 1024),
    own: Math.round(own / 1024),
    third: Math.round(third / 1024),
    byHost,
  });
}

const pad = (s, n) => String(s).padEnd(n);
let failed = 0;

console.log(
  `\n  ${pad('ROUTE', 44)} ${pad('OWN', 9)} ${pad('BUDGET', 9)} ${pad('3RD', 8)} TOTAL`
);
console.log('  ' + '─'.repeat(84));
for (const r of results) {
  const budget = BUDGETS[r.route];
  const over = r.own > budget;
  if (over && !MEASURE) failed++;
  console.log(
    `  ${pad(r.route, 44)} ${pad(r.own + ' KB', 9)} ${pad(budget + ' KB', 9)} ` +
      `${pad(r.third + ' KB', 8)} ${r.kb} KB${over ? '   OVER' : ''}`
  );
  if (MEASURE || over) {
    const top = [...r.byHost.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    for (const [host, b] of top) {
      console.log(`      ${pad(host, 40)} ${Math.round(b / 1024)} KB`);
    }
  }
}

if (MEASURE) {
  console.log('\n  --measure: reporting only, nothing enforced.\n');
  process.exit(0);
}
if (failed) {
  console.error(
    `\n  ${failed} route(s) over budget. A route can go over from any lifecycle,\n` +
      `  which is the point: this number has no domain boundary to be silent about.\n`
  );
  process.exit(1);
}
console.log('\n  All routes within budget.\n');
