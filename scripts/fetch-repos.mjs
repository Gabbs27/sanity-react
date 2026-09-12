/**
 * Snapshots the GitHub repositories into src/config/repos.json.
 *
 * WHY: /repositorios fetched its list from api.github.com in the browser, so
 * anything that does not run the bundle got the page chrome and nothing else —
 * 646 characters, no repository names, no links. Every other route on the site
 * had already been fixed; this one kept its hole because its data came from a
 * third origin at runtime rather than from the CMS or the components.
 *
 * WHY IT IS NOT PART OF THE BUILD: the same reason capture-static.mjs is not.
 * Unauthenticated GitHub allows 60 requests an hour per IP, and Vercel's build
 * IPs are shared, so a build-time fetch would fail intermittently and silently
 * — the worst combination. This runs locally, its output is committed, and
 * prerender.mjs reads the file.
 *
 * The snapshot is a fallback, not the source of truth: the component still
 * fetches live and overwrites it the moment the bundle runs. It ages, which is
 * why the file records when it was taken.
 *
 * A token is used only if GITHUB_TOKEN is in .env, and only here. It must never
 * become VITE_GITHUB_TOKEN — Vite inlines VITE_ variables into the public
 * bundle, which publishes the token to every visitor.
 *
 *   node scripts/fetch-repos.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/config/repos.json');
const USER = 'Gabbs27';
// Same query the component makes, so the snapshot matches what a visitor with
// JavaScript ends up seeing.
const URL_ = `https://api.github.com/users/${USER}/repos?per_page=20&sort=updated`;

let token;
if (existsSync(join(ROOT, '.env'))) {
  const line = readFileSync(join(ROOT, '.env'), 'utf8')
    .split('\n')
    .find((l) => l.startsWith('GITHUB_TOKEN='));
  if (line) token = line.slice('GITHUB_TOKEN='.length).trim();
}

const headers = { Accept: 'application/vnd.github.mercy-preview+json' };
if (token) headers.Authorization = `token ${token}`;

const res = await fetch(URL_, { headers });
if (!res.ok) {
  console.error(
    `GitHub returned HTTP ${res.status}.` +
      (res.status === 403 ? ' Rate limited — unauthenticated is 60/hour per IP.' : '')
  );
  process.exit(1);
}

const repos = (await res.json()).map((r) => ({
  id: r.id,
  name: r.name,
  description: r.description,
  html_url: r.html_url,
  language: r.language,
  stargazers_count: r.stargazers_count,
  forks_count: r.forks_count,
  updated_at: r.updated_at,
  topics: r.topics ?? [],
}));

writeFileSync(
  OUT,
  JSON.stringify({ takenAt: new Date().toISOString(), user: USER, repos }, null, 2) + '\n'
);

const described = repos.filter((r) => r.description).length;
console.log(
  `  ${repos.length} repos -> src/config/repos.json ` +
    `(${described} with a description, ${repos.length - described} without)`
);
