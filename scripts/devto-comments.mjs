/**
 * Which dev.to comments are waiting on a reply.
 *
 * The bottleneck was never writing the reply. It was finding out a comment
 * existed: three articles accumulated nineteen comments before anyone noticed,
 * including two direct questions.
 *
 * WHY THERE IS NO STATE FILE: "new since last run" needs a stored cursor, and a
 * stored cursor drifts — run it on a second machine, or lose the file, and
 * everything looks new or nothing does. "Unanswered" is computed from the data
 * itself: a thread needs a reply when its last comment is not mine. That is the
 * question actually being asked, and it is idempotent.
 *
 * Read-only. dev.to's public API has no endpoint for creating comments —
 * POST /api/comments returns 404 — so this tells you what to answer and you
 * answer it. See the note at the bottom of the output.
 *
 *   node scripts/devto-comments.mjs            # threads awaiting a reply
 *   node scripts/devto-comments.mjs --all      # every thread
 *   node scripts/devto-comments.mjs --json     # machine-readable
 */
const USER = 'gabbs279';
const API = 'https://dev.to/api';
const ALL = process.argv.includes('--all');
const JSON_OUT = process.argv.includes('--json');

const strip = (html) =>
  String(html ?? '')
    .replace(/<\/(p|div|li|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const ago = (iso) => {
  const hours = (Date.now() - new Date(iso)) / 36e5;
  if (hours < 1) return `${Math.round(hours * 60)}m ago`;
  if (hours < 48) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

async function get(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
  return res.json();
}

// A dev.to thread is a tree: comments have children have children. Flatten it
// in reading order so "the last comment" means the last one a human would read.
function flatten(comment, depth = 0, out = []) {
  out.push({
    depth,
    id: comment.id_code,
    user: comment.user.username,
    name: comment.user.name,
    at: comment.created_at,
    text: strip(comment.body_html),
  });
  for (const child of comment.children ?? []) flatten(child, depth + 1, out);
  return out;
}

const articles = await get(`/articles?username=${USER}&per_page=100`);
const waiting = [];
let totalThreads = 0;

for (const article of articles) {
  if (!article.comments_count) continue;
  const threads = await get(`/comments?a_id=${article.id}`);
  for (const thread of threads) {
    totalThreads++;
    const chain = flatten(thread);
    const last = chain[chain.length - 1];
    // Mine already has the last word. Nothing is owed.
    if (!ALL && last.user === USER) continue;
    waiting.push({ article: article.title, url: article.url, chain, last });
  }
}

if (JSON_OUT) {
  console.log(JSON.stringify({ totalThreads, waiting }, null, 2));
} else if (!waiting.length) {
  console.log(`No threads awaiting a reply (${totalThreads} total).`);
} else {
  for (const w of waiting) {
    console.log('='.repeat(78));
    console.log(w.article);
    console.log(w.url);
    console.log('='.repeat(78));
    for (const c in w.chain) {
      const c2 = w.chain[c];
      const pad = '  '.repeat(c2.depth);
      const me = c2.user === USER ? ' (you)' : '';
      console.log(`\n${pad}${c2.name}${me} · ${ago(c2.at)} · ${c2.id}`);
      console.log(
        c2.text
          .split('\n')
          .map((l) => pad + '  ' + l)
          .join('\n')
      );
    }
    console.log(`\n>>> AWAITING REPLY: last word is ${w.last.name}'s, ${ago(w.last.at)}\n`);
  }
  console.log('='.repeat(78));
  console.log(
    `${waiting.length} of ${totalThreads} threads awaiting a reply.\n` +
      `dev.to has no API for posting comments (POST /api/comments is 404),\n` +
      `so these get answered by hand.`
  );
}
