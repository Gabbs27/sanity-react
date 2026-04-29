# Draft: Express → Vercel Functions migration post

> **Status:** draft, not published. Review/edit voice and details, then paste into `/admin/write`.
> The body below is markdown — BlockNote will accept it as-is.

---

## Suggested metadata

- **Title:** Migrating an Express Backend to Vercel Functions Without Downtime
- **Suggested slug:** `migrating-express-to-vercel-functions-no-downtime`
- **Tags:** Vercel, Express, Node.js, Serverless, GA4, Migration
- **Sponsored:** false
- **Affiliate disclosure:** false

---

# Migrating an Express Backend to Vercel Functions Without Downtime

Last week I migrated the analytics backend behind this site from a long-running Express server on Railway to a set of Vercel Functions. The frontend never noticed. Cost dropped from a small monthly Railway bill to **\$0/month** on Vercel's hobby tier. This post walks through how I did it, what broke, and when this kind of migration actually makes sense.

## Why migrate at all

The backend was a tiny Express server that did two things:

1. Wrap the Google Analytics 4 Data API behind an admin-only endpoint so the dashboard on this site could read GA4 metrics without exposing the service-account key.
2. Validate an `ADMIN_TOKEN` to gate that endpoint.

That was it. A few hundred lines of Node, three dependencies, one route. Running it as a 24/7 container on Railway was fine, but it had three quiet costs:

- **Money.** Hobby tier on Railway isn't free anymore. Even a small workload was a recurring charge.
- **Cold starts I didn't need.** The dashboard isn't visited often. The Express server sat idle 99% of the time, costing money to do nothing.
- **Deploy ceremony.** Two repositories, two pipelines, two environments to keep aligned. Every backend change meant context-switching to the Railway dashboard.

Vercel Functions felt like the right shape: stateless handlers that spin up on request, scale to zero when idle, deploy from the same `git push` flow as anything else.

## The before / after

```
BEFORE:
  Frontend (GitHub Pages)
        │ HTTPS
        ▼
  Railway: long-running Node + Express
        ├─ /api/analytics
        ├─ middleware: cors, helmet
        └─ env: ADMIN_TOKEN, GA4 credentials

AFTER:
  Frontend (GitHub Pages)
        │ HTTPS
        ▼
  Vercel Functions
        ├─ api/analytics.js   (one handler per route)
        ├─ api/health.js
        └─ api/_utils/        (extracted helpers — auth, ga4 client)
```

Same external contract, completely different runtime model.

## Step 1 — Turn each Express route into a Vercel handler

A Vercel Function is just a Node module that exports a handler matching `(req, res) => void | Promise<void>`. The shape is essentially `http.IncomingMessage` / `http.ServerResponse` with some extras.

The Express version looked like this:

```js
// Before
app.get('/api/analytics', requireAuth, async (req, res) => {
  const { startDate, endDate } = req.query;
  const data = await runAnalyticsQuery(startDate, endDate);
  res.json(data);
});
```

The Vercel version is the same logic, no `app`, no `next`:

```js
// After: api/analytics.js
const { applyCors, requireAuth } = require('./_utils/auth');
const { runAnalyticsQuery } = require('./_utils/ga4');

module.exports = async (req, res) => {
  if (!applyCors(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAuth(req, res)) return;

  const { startDate, endDate } = req.query;
  const data = await runAnalyticsQuery(startDate, endDate);
  res.json(data);
};
```

Three things to notice:

- **No middleware chain.** Each handler runs the few checks it needs explicitly. With one or two routes per file, this is clearer than a global middleware stack.
- **CORS becomes a function call.** I extracted `applyCors` to share between handlers. It returns `false` and writes the response if the request was a preflight, so the handler can early-exit.
- **Auth, same.** `requireAuth` reads the `Authorization: Bearer <token>` header, compares to `process.env.ADMIN_TOKEN`, and writes a 401 if it fails.

## Step 2 — Extract helpers into `api/_utils/`

Vercel ships every file in `api/` (excluding `_`-prefixed paths) as a public route. Anything starting with `_` is treated as a private utility. This is the convention I used for shared code:

```
api/
├── analytics.js
├── health.js
└── _utils/
    ├── auth.js
    └── ga4.js
```

The GA4 helper memoises the client across invocations, which matters because Vercel Functions reuse warm container instances when traffic is steady:

```js
// api/_utils/ga4.js
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

let cached = null;

function getClient() {
  if (cached) return cached;
  cached = new BetaAnalyticsDataClient({
    credentials: {
      client_email: process.env.GA4_CLIENT_EMAIL,
      private_key: process.env.GA4_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
  });
  return cached;
}
```

That `replace(/\\n/g, '\n')` is the one consistent pain point of moving service-account keys between secret stores. Vercel preserves real newlines in multi-line env values, so if you paste with literal `\n` from a copied JSON file, you have to undo the escaping.

## Step 3 — Configure `vercel.json`

Vercel infers most of the project layout, but it's worth being explicit about CORS origins and Node version:

```json
{
  "version": 2,
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs20.x"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://codewithgabo.com" }
      ]
    }
  ]
}
```

I keep the dynamic origin allowlist (which supports multiple domains during development) inside `applyCors` and use the static header here only as a defense-in-depth layer.

## Step 4 — Migrate environment variables

I copied each env var from Railway's dashboard to Vercel's, set them for **Production + Preview + Development** so dev runs (`vercel dev`) work locally. The two non-trivial ones:

- `GA4_PRIVATE_KEY` — multi-line value with real newlines. Pasted directly; no escaping.
- `FRONTEND_URL` — a comma-separated list (`https://codewithgabo.com,https://gabbs27.github.io,http://localhost:3000`) consumed by the CORS helper. This was new — Express had it baked into a `cors()` middleware config.

## Step 5 — Smoke-test before flipping traffic

The old Railway service was still live during the migration. I deployed Vercel to a preview URL, hit it from `curl` with a real `ADMIN_TOKEN`, confirmed the JSON response matched the Railway version, then updated the frontend's `VITE_ANALYTICS_API_URL` env to point at the new Vercel alias and redeployed.

Once the dashboard rendered metrics from Vercel, I stopped the Railway service. No DNS games, no routing rules, no reverse proxy cutover. The frontend rebuild was the cutover.

## Three gotchas I hit

**1. File uploads.** A later endpoint (`api/upload.js`) accepts a multipart image and proxies it to Sanity's asset API. Express handled multipart through `multer` middleware. On Vercel I had to parse the multipart body manually because the platform's default body parser only handles JSON. Vercel exposes `req.body` as a `Buffer` for unknown content types — from there it's `busboy` or roll-your-own boundary parsing.

**2. Cold starts on the first hit of the day.** A Vercel Function that hasn't been invoked recently can take \~500–1500ms to spin up. For a dashboard that's only checked occasionally, this is fine. For a user-facing API on the critical path, it would be a real concern — pre-warming or pinning the function to a region helps, but it's a tradeoff to keep in mind.

**3. The `_utils/` import path.** The first time I deployed, I forgot that Vercel's build doesn't follow files outside `api/` automatically. Putting helpers under `api/_utils/` (with the leading underscore) lets the bundler find them while keeping them private.

## The result

| Metric | Before (Railway) | After (Vercel) |
|---|---|---|
| Monthly cost | small but recurring | \$0 |
| Cold start | ~50ms (always warm) | 500–1500ms first hit |
| Deploy flow | separate dashboard | `git push` |
| Dependencies | express, cors, helmet, nodemon | none (platform handles it) |
| Repo files | server.js, routes/, middleware/ | a few handlers under `api/` |

For a small admin endpoint like this one, Vercel Functions are clearly the right fit. For a high-traffic API where every millisecond matters, Railway or Fly would still be the better answer.

## When NOT to do this

A migration like this only makes sense if:

- Your traffic is bursty or low — cold starts won't dominate the user experience.
- Your handlers are stateless. Long-lived WebSocket connections, in-memory caches, or background workers don't translate cleanly.
- You can live with the 10-second per-invocation timeout on the hobby tier (or pay for longer on a higher tier).

If you're running a chat server, a worker pool, or anything with sticky in-memory state, stay on a long-running container. For everything else — REST endpoints, webhooks, glue between services — serverless is hard to beat.

## Closing thought

The most underrated part of this migration was deleting `server.js`, the `routes/` folder, and four packages from `package.json`. Less code is less to maintain. Less infrastructure is less to monitor. The new setup does exactly the same thing, on better terms, with fewer moving parts.

If you have a small backend doing low-traffic admin work and you're paying month after month to keep it running, this is worth half a day of your time.
