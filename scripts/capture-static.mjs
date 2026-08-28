/**
 * Captures the rendered content of the routes that are not posts.
 *
 * WHY: the eight non-post routes shared one title, one description and no
 * canonical, because prerender.mjs only knows about posts — those come from
 * Sanity, and these live in React components. Worse, the catch-all rewrite
 * answered all of them with the shell, so after the noscript fix a crawler
 * asking for /privacy got the home page's post list instead of the policy.
 *
 * Parsing the JSX for its text was the other option and it is the kind of check
 * that fails silently: a regex that stops matching returns nothing, and nothing
 * looks like success. So this renders the real app and reads the real result.
 *
 * WHY IT IS NOT PART OF THE BUILD: Vercel's build image has no Chrome. An
 * earlier version of prerender.mjs drove headless Chrome and had to be thrown
 * away for exactly that reason. So this runs locally, writes its output to
 * src/config/static-pages.json, and that file is committed. prerender.mjs reads
 * the JSON on Vercel and never launches a browser.
 *
 * The staleness that buys is real: edit Privacy.tsx, forget to re-run this, and
 * the committed capture is a rumour. Each entry therefore stores a hash of its
 * source component, and surfaces.test.mjs fails when the two diverge.
 *
 *   npm run build && node scripts/capture-static.mjs
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = join(ROOT, 'build');
const OUT = join(ROOT, 'src/config/static-pages.json');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 4319;
const CDP = 9335;

// route -> the component that owns it. The hash of that file is what tells a
// later build that this capture went stale.
const ROUTES = {
  '/allpost': 'src/components/AllPosts.tsx',
  '/about': 'src/components/About.tsx',
  '/gabriel-abreu': 'src/components/Me.tsx',
  '/services': 'src/components/Services.tsx',
  '/repositorios': 'src/components/Repos.tsx',
  '/education': 'src/components/Education.tsx',
  '/privacy': 'src/components/Privacy.tsx',
  '/terms': 'src/components/Terms.tsx',
};

if (typeof WebSocket !== 'function') {
  console.error('Needs Node >= 22 (global WebSocket). Try: nvm use 22');
  process.exit(1);
}
if (!existsSync(BUILD)) {
  console.error('No build/. Run `npm run build` first.');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.ico': 'image/x-icon', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.xml': 'application/xml', '.txt': 'text/plain',
};

// Static files, with the same catch-all-to-index fallback vercel.json applies,
// so what gets rendered here is what production would render.
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let file = join(BUILD, url.pathname);
  if (!existsSync(file) || extname(file) === '') {
    const indexed = join(file, 'index.html');
    file = existsSync(indexed) ? indexed : join(BUILD, 'index.html');
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(PORT, r));

const chrome = spawn(CHROME, [
  '--headless', '--disable-gpu', '--no-first-run',
  `--remote-debugging-port=${CDP}`, 'about:blank',
]);
for (let i = 0; i < 30; i++) {
  try {
    await (await fetch(`http://127.0.0.1:${CDP}/json/version`)).json();
    break;
  } catch {
    await sleep(300);
  }
}

async function capture(route) {
  const target = await (
    await fetch(`http://127.0.0.1:${CDP}/json/new?about:blank`, { method: 'PUT' })
  ).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m.result);
      pending.delete(m.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((res) => {
      const myId = ++id;
      pending.set(myId, res);
      ws.send(JSON.stringify({ id: myId, method, params }));
    });

  await send('Page.enable');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${route}` });
  await sleep(3500);

  const grab = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content ?? '',
      html: document.getElementById('root')?.innerHTML ?? '',
      text: (document.getElementById('root')?.innerText ?? '').replace(/\\s+/g,' ').trim(),
    })`,
    returnByValue: true,
  });

  ws.close();
  await fetch(`http://127.0.0.1:${CDP}/json/close/${target.id}`);
  return JSON.parse(grab.result.value);
}

// The rendered markup carries class names, SVG icons and interactive controls
// that mean nothing without the bundle. Keep the parts that carry meaning to a
// reader: headings, paragraphs, lists, and links.
function readable(html) {
  return html
    .replace(/<(script|style|svg|button|input|textarea|select|form)[\s\S]*?<\/\1>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/\s(class|style|id|data-[\w-]+|aria-[\w-]+|role|target|rel)="[^"]*"/gi, '')
    .replace(/<(?!\/?(h[1-6]|p|ul|ol|li|a|strong|em|code|pre|blockquote|section|article)\b)[^>]+>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const captured = {};
for (const [route, component] of Object.entries(ROUTES)) {
  const { title, description, html, text } = await capture(route);
  const source = readFileSync(join(ROOT, component), 'utf8');
  captured[route] = {
    component,
    // Not a cache key — a staleness alarm. surfaces.test.mjs compares this to
    // the file on disk, so editing the component without re-running this script
    // turns the committed capture red instead of leaving it quietly wrong.
    sourceHash: createHash('sha256').update(source).digest('hex').slice(0, 16),
    title,
    description,
    html: readable(html),
  };
  console.log(`  ${route.padEnd(18)} ${String(text.length).padStart(6)} chars  ${title}`);
}

chrome.kill();
server.close();

writeFileSync(OUT, JSON.stringify(captured, null, 2) + '\n');
console.log(`\n  ${Object.keys(captured).length} routes -> src/config/static-pages.json`);
