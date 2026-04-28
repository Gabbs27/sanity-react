# Slice 2 — Migrate analytics-backend to Vercel Functions

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the Express server in `analytics-backend/server.js` into per-route Vercel Functions while preserving the exact response shape consumed by the dashboard.

**Architecture:**
- `analytics-backend/api/` directory holds one file per HTTP route — Vercel auto-mounts each as a serverless function
- Shared logic (auth middleware, GA4 client + formatters) extracted into `analytics-backend/api/_utils/` (underscore prefix tells Vercel not to expose it as a route)
- Drop `express`, `cors`, `helmet`, `express-rate-limit` from runtime deps. CORS handled via headers in each handler. Security headers via `vercel.json`. Rate-limit deferred (add later if needed via `@upstash/ratelimit`).
- The frontend's `useAnalyticsData` hook expects the exact `{overview, pageViews, topPages, topCountries, devices, browsers, realtimeUsers}` shape — we keep formatters bit-for-bit identical.

**Tech Stack:** Node.js Vercel Functions (default runtime), `@google-analytics/data` SDK, `@vercel/node` types (dev only). No Express, no helmet.

**Env vars (verified in current `server.js`, CORRECTING earlier design doc that said `GOOGLE_CREDENTIALS`):**
- `ADMIN_TOKEN` — Bearer auth token
- `FRONTEND_URL` — comma-separated allowed CORS origins (e.g. `https://codewithgabo.com,https://gabbs27.github.io`)
- `GA4_CLIENT_EMAIL` — service account email
- `GA4_PRIVATE_KEY` — service account private key (literal `\n` newlines escaped as `\\n` in env)
- `GA4_PROPERTY_ID` — GA4 property numeric ID

**Branch context:** continue on `developer` branch, working tree clean.

---

## Verification policy

- After each task: file contents readable, no syntax errors, imports resolve
- After Task 5: `npx vercel build` (or equivalent dry-build) succeeds without runtime errors. If `vercel` CLI not available locally, fall back to a direct Node import test of the entry module
- After Task 6: `git status` shows only the expected diff per slice
- Manual deployment + smoke test of the dashboard against the deployed URL is OUT OF SCOPE for this slice — captured in Task 7 as documentation only

---

## Task 1: Add `vercel.json` configuration

**Files:**
- Create: `analytics-backend/vercel.json`

### Step 1.1: Create the file with this exact content

```json
{
  "version": 2,
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

This applies basic security headers Vercel sends in addition to its defaults. CORS is handled per-handler (not here) because allowed origins depend on env vars.

### Step 1.2: Commit

```bash
git add analytics-backend/vercel.json
git commit -m "chore(backend): add vercel.json with security headers"
```

No `Co-Authored-By` trailer.

---

## Task 2: Extract `_utils/auth.js`

**Files:**
- Create: `analytics-backend/api/_utils/auth.js`

### Step 2.1: Create the helper

```js
// Shared Bearer auth check for admin endpoints.
// Returns true when the request is authorized; otherwise sends a 401 and returns false.
// Caller pattern:
//   if (!requireAdmin(req, res)) return;

function requireAdmin(req, res) {
  const auth = req.headers.authorization || '';
  const token = process.env.ADMIN_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'Server misconfigured: ADMIN_TOKEN not set' });
    return false;
  }
  if (auth !== `Bearer ${token}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

module.exports = { requireAdmin };
```

### Step 2.2: Commit

```bash
git add analytics-backend/api/_utils/auth.js
git commit -m "refactor(backend): extract Bearer auth helper for Vercel Functions"
```

---

## Task 3: Extract `_utils/ga4.js`

**Files:**
- Create: `analytics-backend/api/_utils/ga4.js`

### Step 3.1: Create the file

This module exports:
- `getClient()` — lazily initializes and caches the `BetaAnalyticsDataClient`
- `applyCors(req, res)` — sets CORS headers based on `FRONTEND_URL` env, returns `true` and ends preflight responses (returns `false` after end)
- `formatAnalyticsData(responses)` — preserves the EXACT formatting from current `server.js` lines 194-287
- `formatDate(dateString)` — preserves the EXACT formatter from `server.js` lines 290-296

```js
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

let cachedClient = null;

function getClient() {
  if (cachedClient) return cachedClient;
  cachedClient = new BetaAnalyticsDataClient({
    credentials: {
      client_email: process.env.GA4_CLIENT_EMAIL,
      private_key: process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  });
  return cachedClient;
}

function applyCors(req, res) {
  const origin = req.headers.origin || '';
  const allowed = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((u) => u.trim());

  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false;
  }
  return true;
}

function formatDate(dateString) {
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  const date = new Date(`${year}-${month}-${day}`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatAnalyticsData(responses) {
  const { overview, pageViews, topPages, countries, devices, browsers, realtime } = responses;

  const overviewRow = overview.rows?.[0];
  const totalVisits = parseInt(overviewRow?.metricValues[0]?.value || 0);
  const uniqueVisitors = parseInt(overviewRow?.metricValues[1]?.value || 0);
  const pageViewsTotal = parseInt(overviewRow?.metricValues[2]?.value || 0);
  const avgDuration = parseFloat(overviewRow?.metricValues[3]?.value || 0);
  const bounceRate = parseFloat(overviewRow?.metricValues[4]?.value || 0);
  const newUsers = parseInt(overviewRow?.metricValues[5]?.value || 0);

  const pageViewsData = pageViews.rows?.map((row) => ({
    date: formatDate(row.dimensionValues[0].value),
    views: parseInt(row.metricValues[0].value),
    visitors: parseInt(row.metricValues[1].value),
  })) || [];

  const topPagesData = topPages.rows?.map((row) => ({
    page: row.dimensionValues[1].value,
    title: row.dimensionValues[0].value,
    views: parseInt(row.metricValues[0].value),
    avgTime: formatDuration(parseFloat(row.metricValues[1].value)),
    bounceRate: (parseFloat(row.metricValues[2].value) * 100).toFixed(1) + '%',
  })) || [];

  const totalCountryUsers = countries.rows?.reduce(
    (sum, row) => sum + parseInt(row.metricValues[0].value),
    0
  ) || 1;
  const topCountriesData = countries.rows?.map((row) => {
    const users = parseInt(row.metricValues[0].value);
    return {
      country: row.dimensionValues[0].value,
      visitors: users,
      percentage: Math.round((users / totalCountryUsers) * 100),
    };
  }) || [];

  const totalDeviceUsers = devices.rows?.reduce(
    (sum, row) => sum + parseInt(row.metricValues[0].value),
    0
  ) || 1;
  const devicesData = devices.rows?.map((row) => {
    const users = parseInt(row.metricValues[0].value);
    return {
      device: row.dimensionValues[0].value,
      users,
      percentage: Math.round((users / totalDeviceUsers) * 100),
    };
  }) || [];

  const totalBrowserUsers = browsers.rows?.reduce(
    (sum, row) => sum + parseInt(row.metricValues[0].value),
    0
  ) || 1;
  const browsersData = browsers.rows?.map((row) => {
    const users = parseInt(row.metricValues[0].value);
    return {
      browser: row.dimensionValues[0].value,
      users,
      percentage: Math.round((users / totalBrowserUsers) * 100),
    };
  }) || [];

  const realtimeUsers = parseInt(realtime.rows?.[0]?.metricValues[0]?.value || 0);

  return {
    overview: {
      totalVisits,
      uniqueVisitors,
      pageViews: pageViewsTotal,
      avgSessionDuration: formatDuration(avgDuration),
      bounceRate: (bounceRate * 100).toFixed(1) + '%',
      newVsReturning: {
        new: Math.round((newUsers / uniqueVisitors) * 100),
        returning: Math.round(((uniqueVisitors - newUsers) / uniqueVisitors) * 100),
      },
    },
    pageViews: pageViewsData,
    topPages: topPagesData,
    topCountries: topCountriesData,
    devices: devicesData,
    browsers: browsersData,
    realtimeUsers,
  };
}

module.exports = { getClient, applyCors, formatAnalyticsData };
```

### Step 3.2: Commit

```bash
git add analytics-backend/api/_utils/ga4.js
git commit -m "refactor(backend): extract GA4 client + CORS + formatter helpers"
```

---

## Task 4: Create `api/analytics.js` and `api/health.js` handlers

**Files:**
- Create: `analytics-backend/api/analytics.js`
- Create: `analytics-backend/api/health.js`

### Step 4.1: Create `api/health.js`

```js
const { applyCors } = require('./_utils/ga4');

module.exports = async (req, res) => {
  if (!applyCors(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
};
```

### Step 4.2: Create `api/analytics.js`

The handler runs the same 7 GA4 queries from `server.js` lines 99-170. Copy them verbatim.

```js
const { requireAdmin } = require('./_utils/auth');
const { getClient, applyCors, formatAnalyticsData } = require('./_utils/ga4');

module.exports = async (req, res) => {
  if (!applyCors(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  try {
    const dateRange = req.query.dateRange || '30days';
    const propertyId = process.env.GA4_PROPERTY_ID;
    const client = getClient();

    const endDate = 'today';
    let startDate;
    switch (dateRange) {
      case '7days':
        startDate = '7daysAgo';
        break;
      case '90days':
        startDate = '90daysAgo';
        break;
      default:
        startDate = '30daysAgo';
    }

    const [overviewResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'newUsers' },
      ],
    });

    const [pageViewsResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });

    const [topPagesResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    });

    const [countriesResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      limit: 10,
    });

    const [devicesResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'totalUsers' }],
    });

    const [browsersResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'browser' }],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      limit: 10,
    });

    const [realtimeResponse] = await client.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: 'activeUsers' }],
    });

    const formatted = formatAnalyticsData({
      overview: overviewResponse,
      pageViews: pageViewsResponse,
      topPages: topPagesResponse,
      countries: countriesResponse,
      devices: devicesResponse,
      browsers: browsersResponse,
      realtime: realtimeResponse,
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics data',
      message: error.message,
    });
  }
};
```

### Step 4.3: Commit

```bash
git add analytics-backend/api/analytics.js analytics-backend/api/health.js
git commit -m "feat(backend): add Vercel Function handlers for analytics and health"
```

---

## Task 5: Update `package.json` and remove `server.js`

**Files:**
- Modify: `analytics-backend/package.json` — remove unused deps, update scripts
- Delete: `analytics-backend/server.js`

### Step 5.1: Update `package.json`

Remove from `dependencies`: `express`, `cors`, `helmet`, `express-rate-limit`. Keep `@google-analytics/data` and `dotenv` (dotenv still useful for local `vercel dev`).

Update `scripts`:
- Remove `start: node server.js` and `dev: nodemon server.js`
- Add `dev: vercel dev` and `build: vercel build` (assuming Vercel CLI installed globally; otherwise users run `npx vercel dev`)

Also remove `nodemon` from `devDependencies`.

The `main` field can be removed (Vercel uses convention).

### Step 5.2: Run `npm install` to update lockfile

```bash
cd /Users/gabriel/Desktop/Programacion/ReactJs/sanity-react/analytics-backend
npm install
```

### Step 5.3: Delete `server.js`

```bash
rm analytics-backend/server.js
```

### Step 5.4: Commit

```bash
git add analytics-backend/package.json analytics-backend/package-lock.json
git rm analytics-backend/server.js
git commit -m "refactor(backend): remove Express, switch to Vercel Functions

Remove express, cors, helmet, express-rate-limit, nodemon dependencies.
Replace dev script with 'vercel dev'. Delete server.js — its routes
are now per-file Vercel Functions in api/."
```

---

## Task 6: Local syntax verification

Without deploying, verify the new files load correctly.

### Step 6.1: Check that handler modules can be required

```bash
cd /Users/gabriel/Desktop/Programacion/ReactJs/sanity-react/analytics-backend
node -e "const a = require('./api/analytics'); const h = require('./api/health'); const auth = require('./api/_utils/auth'); const ga = require('./api/_utils/ga4'); console.log('analytics:', typeof a); console.log('health:', typeof h); console.log('auth:', Object.keys(auth)); console.log('ga4:', Object.keys(ga));"
```

Expected output:
```
analytics: function
health: function
auth: [ 'requireAdmin' ]
ga4: [ 'getClient', 'applyCors', 'formatAnalyticsData' ]
```

If any module fails to load, fix and re-verify before continuing.

### Step 6.2: No commit needed if Step 6.1 passes — verification only

---

## Task 7: Document manual deployment steps

The actual deploy + smoke test is OUTSIDE this slice's automated scope because it requires the user's Vercel account login and env-var population. Document the steps in the design doc so the user has a checklist.

### Step 7.1: Append to `docs/plans/2026-04-27-admin-panel-monetization-design.md`

Add a "Slice 2 manual deployment steps" section under the Slice progress section:

```markdown
### Slice 2 manual deployment (when ready)

1. Install Vercel CLI: `npm i -g vercel` (or use `npx vercel ...`)
2. From `analytics-backend/`, run `vercel login` then `vercel`. Accept defaults; project name suggestion: `analytics-backend`.
3. Set env vars in Vercel dashboard → project → Settings → Environment Variables:
   - `ADMIN_TOKEN` (copy from Railway)
   - `FRONTEND_URL=https://codewithgabo.com,https://gabbs27.github.io,http://localhost:3000`
   - `GA4_CLIENT_EMAIL` (from Railway)
   - `GA4_PRIVATE_KEY` (from Railway — keep `\n` as literal `\\n`)
   - `GA4_PROPERTY_ID` (from Railway)
4. Promote to production: `vercel --prod`. Note the URL (e.g. `https://analytics-backend-<hash>.vercel.app` or your custom domain).
5. Update frontend `.env.production`:
   ```
   VITE_ANALYTICS_API_URL=https://<your-vercel-url>
   ```
6. Rebuild + redeploy the portfolio: `npm run deploy` from project root.
7. Smoke test: open `https://codewithgabo.com/#/admin-login`, paste `ADMIN_TOKEN`, confirm dashboard loads with real metrics.
8. Decommission Railway: stop the `analytics-backend` service in the Railway dashboard.
```

### Step 7.2: Commit doc update

```bash
git add docs/plans/2026-04-27-admin-panel-monetization-design.md
git commit -m "docs: add slice 2 manual deployment checklist"
```

---

## Done criteria for Slice 2

- [ ] `analytics-backend/api/analytics.js`, `api/health.js`, `api/_utils/auth.js`, `api/_utils/ga4.js`, `vercel.json` exist with the specified content
- [ ] `analytics-backend/server.js` is deleted
- [ ] `package.json` has only the runtime deps actually used (`@google-analytics/data`, `dotenv`)
- [ ] `node -e "require('./api/analytics')..."` loads all modules without errors
- [ ] Each commit is atomic and revertible
- [ ] Manual deployment checklist is committed in the design doc
- [ ] Frontend `.env.production` is NOT touched in this slice (waits for the user to deploy and report the URL)

---

## Skills referenced

- @superpowers:executing-plans — task-by-task execution
- @superpowers:verification-before-completion — gates each commit on verification
- @superpowers:systematic-debugging — if Task 6 verification reveals a load error
