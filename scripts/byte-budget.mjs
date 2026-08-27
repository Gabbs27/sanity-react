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

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const ORIGIN = process.env.BUDGET_ORIGIN ?? 'https://codewithgabo.com';
const MEASURE = process.argv.includes('--measure');

// Budgets are a ratchet, not an aspiration: set just above what each route
// weighs today, so the check fails on a regression rather than nagging about an
// ideal nobody is working toward. Lower them when a route gets lighter.
const BUDGETS = {
  '/': 900,
  '/allpost': 900,
  '/green-and-blind': 900,
  '/the-audits-blind-spot': 900,
  '/3-prompts-gemini-nano-banana-resultados': 1200,
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

const chrome = spawn(CHROME, [
  '--headless',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-networking',
  `--remote-debugging-port=${PORT}`,
  'about:blank',
]);

let version;
for (let i = 0; i < 30; i++) {
  try {
    version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
    break;
  } catch {
    await sleep(300);
  }
}
if (!version) {
  chrome.kill();
  throw new Error('Chrome did not expose a debugging port');
}

async function weigh(route) {
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
      bytes += params.encodedDataLength;
      const url = inFlight.get(params.requestId) ?? '';
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
  const { bytes, byHost } = await weigh(route);
  results.push({ route, kb: Math.round(bytes / 1024), byHost });
}

chrome.kill();

const pad = (s, n) => String(s).padEnd(n);
let failed = 0;

console.log(`\n  ${pad('ROUTE', 44)} ${pad('MEASURED', 10)} ${pad('BUDGET', 9)}`);
console.log('  ' + '─'.repeat(66));
for (const r of results) {
  const budget = BUDGETS[r.route];
  const over = r.kb > budget;
  if (over && !MEASURE) failed++;
  console.log(
    `  ${pad(r.route, 44)} ${pad(r.kb + ' KB', 10)} ${pad(budget + ' KB', 9)} ${
      over ? '  OVER' : ''
    }`
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
