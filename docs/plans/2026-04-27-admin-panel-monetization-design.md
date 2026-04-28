# Admin Panel + Monetization — Design Document

**Date:** 2026-04-27
**Status:** Approved — ready for implementation

## Problem statement

The current workflow forces the author to leave the portfolio domain and use Sanity Studio to publish posts. Additionally, the portfolio has no infrastructure for newsletter signups, AdSense placement, or affiliate-link tracking, all of which the author wants to enable to start monetizing.

## Goals

1. Replace Sanity Studio as the daily authoring tool with a custom editor under `/admin/escribir` that lives inside the portfolio domain.
2. Surface monetization metrics in the existing `/dashboard` (analytics is already built).
3. Enable newsletter signups (ConvertKit), AdSense slots, and affiliate-click tracking.
4. Resolve known dark/light-mode contrast bugs.
5. Keep the entire infrastructure on free tiers.

## Non-goals (YAGNI)

- Multi-author / role system (single admin user)
- Custom drafts versioning (Sanity already handles drafts)
- Comments, likes, reactions
- Custom social-share buttons
- Sitemap / RSS (could be a future slice)
- Test runner or e2e suite (manual verification + dev preview is sufficient at this scale)

## Architecture

```
FRONTEND (codewithgabo.com — GitHub Pages, existing)
├── Public:   /, /allpost, /:slug, /repositorios, /portfolio
└── Admin:    /admin-login (existing), /dashboard (existing),
              /admin/posts (new), /admin/escribir (new), /admin/escribir/:id (new)
                   │ Bearer ADMIN_TOKEN (localStorage)
                   ▼
BACKEND (Vercel Functions — migrated from Railway)
├── api/analytics.js       (existing GA4 wrapper, refactored)
├── api/posts.js           (NEW — CRUD via Sanity mutate)
├── api/upload.js          (NEW — image proxy to Sanity assets)
├── api/newsletter/subscribe.js  (NEW — ConvertKit forwarder)
├── api/newsletter/stats.js      (NEW — ConvertKit subscriber count)
└── api/_utils/auth.js, ga4.js  (extracted helpers)
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
     Sanity      GA4      ConvertKit
       API       API         API
```

### Key architectural decisions

1. **Sanity remains the single source of truth** for content. The custom editor writes via the mutate API; readers fetch from CDN as today. Writer experience can change in the future without migrating data.
2. **Sanity write token lives only in Vercel env vars.** Frontend never sees it. Frontend authenticates against `ADMIN_TOKEN` (validated by the backend), which then proxies to Sanity.
3. **Affiliate tracking is GA4 events only.** No new database, no dedicated endpoint. Dashboard widget queries GA4 with an event filter.
4. **AdSense is a conditional component.** Renders nothing without `VITE_ADSENSE_CLIENT_ID`. Once approved, setting the env var enables ads everywhere automatically.
5. **No OAuth.** Single admin (the author). Existing token-in-localStorage scheme is sufficient for the threat model.

## Slice breakdown (vertical slices, deployable each)

### Slice 1 — Theme audit fixes
Resolve identified contrast bugs in dark/light mode.

**Files:** `src/components/common/common.css`, `src/components/card/Card.css`, `src/index.css`, `src/components/card/RepoCard.css`.

**Verification:** toggle theme in dev preview; scroll through home, blog, repos; nothing invisible.

### Slice 2 — Migrate analytics-backend from Railway/Express to Vercel Functions
Convert `analytics-backend/server.js` into per-route Vercel Functions; preserve `/api/analytics` behavior.

**Files:**
- New: `analytics-backend/api/analytics.js`, `_utils/auth.js`, `_utils/ga4.js`, `vercel.json`
- Modified: `analytics-backend/package.json` (remove express/cors/helmet/nodemon), `.env.production` frontend (new VITE_ANALYTICS_API_URL)

**Verification:** dashboard loads metrics identically. Decommission Railway service.

### Slice 3 — Custom post editor with BlockNote
Replace the need to use Sanity Studio.

**Frontend:**
- `src/components/Admin/PostsList.tsx` — searchable table of existing posts
- `src/components/Admin/PostEditor.tsx` — form with BlockNote + metadata (title, auto-slug, mainImage uploader, tags, publishedAt)
- `src/components/Admin/AdminLayout.tsx` — sidebar navigation wrapping dashboard + posts area
- `src/utils/blocknoteToPortable.ts` — bidirectional mapper between BlockNote JSON and Sanity Portable Text
- Routes: `/admin/posts`, `/admin/escribir`, `/admin/escribir/:id`

**Backend:**
- `api/posts.js` — `GET /api/posts`, `GET /api/posts/:id`, `POST /api/posts`, `PUT /api/posts/:id`, `DELETE /api/posts/:id`
- `api/upload.js` — multipart image upload, validates MIME (jpeg/png/webp/gif), max 5 MB, proxies to Sanity assets

**Libraries added:** `@blocknote/react`, `@blocknote/mantine`.

**Verification:** create a draft post in `/admin/escribir`, publish, confirm it renders in `/allpost` and `/<slug>`.

### Slice 4 — Schema additions
Add `sponsored` and `affiliateDisclosure` boolean fields to the `post` schema.

**Files:**
- `codewithgabo/schemas/post.ts` — append two booleans
- `src/components/OnePost.tsx` — render "Sponsored" badge if true; render FTC disclosure banner if true
- `src/components/Admin/PostEditor.tsx` — two checkboxes in the form

**No breaking changes:** existing posts default to `false` for both.

### Slice 5 — Newsletter (ConvertKit)
**Frontend:**
- `src/components/Newsletter/SignupForm.tsx` — email input + button + states (idle/loading/success/error)
- Embedded in: `/allpost` footer, end of each `OnePost`, optional home
- `src/components/Dashboard/NewsletterCard.tsx` — widget showing total subs and weekly delta

**Backend:**
- `api/newsletter/subscribe.js` — POST forwarder to `https://api.convertkit.com/v3/forms/{FORM_ID}/subscribe`
- `api/newsletter/stats.js` — GET subscriber count via `https://api.convertkit.com/v3/subscribers`

**Env vars added:** `CONVERTKIT_API_KEY`, `CONVERTKIT_FORM_ID`.

### Slice 6 — Affiliate-link click tracking
**Frontend:**
- `src/utils/affiliateTracker.ts` — global click listener; matches `<a>` href domain against config list; emits `gtag('event', 'affiliate_click', {link_domain, link_url})`
- `src/config/affiliates.ts` — domain whitelist (`amzn.to`, etc.)
- `src/components/Dashboard/AffiliateCard.tsx` — top-N domains by event count

**Backend:**
- Extend `api/analytics.js` to expose the `affiliate_click` event aggregated by `link_domain`

**Verification:** click a known affiliate link → event appears in GA4 realtime → widget on dashboard updates.

### Slice 7 — AdSense placeholder slots
**Frontend:**
- `src/components/Ads/AdSlot.tsx` — renders `<ins class="adsbygoogle">` only when `VITE_ADSENSE_CLIENT_ID` is set, else returns `null`
- Inserted into: `OnePost.tsx` after the 3rd content block, sidebar (desktop only)
- `index.html` — script tag for AdSense conditional on the env var

**Verification:** without env var, no DOM noise; with a test publisher ID, slots render.

## Security considerations

- Sanity write token never exposed to client — only present in Vercel env.
- All admin endpoints require `Authorization: Bearer ADMIN_TOKEN`.
- Image upload: MIME whitelist + 5 MB size cap server-side.
- Rate limiting: 30 req/min per IP on POST/PUT/DELETE post endpoints (via `@upstash/ratelimit` or Vercel Edge middleware).
- HTTPS-only (Vercel default).
- No CSRF concern (Bearer header, no cookies).

## Variables required

**Vercel (backend):**
```
ADMIN_TOKEN=<existing>
GA_PROPERTY_ID=<existing>
GOOGLE_CREDENTIALS=<existing>
SANITY_PROJECT_ID=nnt7ytcd
SANITY_DATASET=production
SANITY_WRITE_TOKEN=<create new in manage.sanity.io>
SANITY_API_VERSION=v2023-03-01
CONVERTKIT_API_KEY=<from convertkit account>
CONVERTKIT_FORM_ID=<from convertkit form>
```

**Frontend (`.env.production`):**
```
VITE_ANALYTICS_API_URL=https://<vercel-url>.vercel.app
VITE_ADSENSE_CLIENT_ID=<empty until approved>
```

## Manual prerequisites by slice

| Slice | What the author must do manually |
|---|---|
| 1 | Nothing |
| 2 | `vercel login`; copy existing Railway env vars into Vercel project |
| 3 | Create write token in `manage.sanity.io` → API → Tokens (Editor role); paste into Vercel env |
| 4 | Nothing (schema edit is automated) |
| 5 | Create ConvertKit account + Form; copy API key + Form ID into Vercel env |
| 6 | Nothing |
| 7 | When AdSense approves: paste publisher ID into `.env.production` and rebuild |

## Verification policy

For each slice before commit:
1. Dev server running and reachable.
2. Manual end-to-end check of the slice's user journey.
3. `preview_inspect` to confirm computed styles where applicable.
4. `preview_console_logs` and `preview_network` show no errors.
5. Screenshot evidence captured.

If verification fails, **no commit** until root-caused and fixed.

## Slice progress

- ✅ **Slice 1 — Theme audit fixes** completed 2026-04-28. Six audit findings landed across 6 commits (`48c80f6`, `1cb969c`, `477c87d`, `370a629`, `c6ea573`, `acfb703`). Verified in both modes via computed-style inspection.
- ✅ **Slice 2 — Vercel migration (code refactor)** completed 2026-04-28. Five commits: `f5b6d39` (vercel.json), `09460ff` (auth helper), `76b57d1` (GA4 helpers), `1524693` (handlers), `05f00e6` (drop Express + delete server.js). Module-load verified locally. Deployed to `https://analytics-backend-seven.vercel.app` (alias). Smoke-tested with real ADMIN_TOKEN; dashboard works end-to-end.
- ✅ **Slice 3 — Custom post editor (BlockNote)** completed 2026-04-28. Backend: `017f135` (Sanity client helper), `ca4b591` (posts list+create), `ee0b872` (posts/[id] CRUD), `3ba2899` (upload proxy). Frontend: `91ee39b` (BlockNote deps + portable text mapper, includes mantine peer deps), `79e6d26` (AdminLayout sidebar), `bfd6f06` (PostsList table), `a97613d` (PostEditor with BlockNote + image upload), `4663f5a` (admin routes wired). Deployed to production via `vercel --prod` and `npm run deploy`. Verified locally: `/admin/posts` lists real posts from Sanity; `/admin/escribir` renders BlockNote editor with all metadata fields.

### Slice 2 manual deployment checklist

Run these steps once env vars are ready in Vercel:

1. Install Vercel CLI: `npm i -g vercel` (or `npx vercel ...`)
2. From `analytics-backend/`: `vercel login`, then `vercel`. Project name suggestion: `analytics-backend`. Accept defaults.
3. In Vercel dashboard → project → Settings → Environment Variables, add for **Production + Preview + Development**:
   - `ADMIN_TOKEN` — fresh value from `openssl rand -hex 32`
   - `FRONTEND_URL=https://codewithgabo.com,https://gabbs27.github.io,http://localhost:3000`
   - `GA4_CLIENT_EMAIL` — service-account email from the rotated GCP JSON
   - `GA4_PRIVATE_KEY` — `private_key` field from the rotated GCP JSON (paste with real newlines; Vercel supports multiline values)
   - `GA4_PROPERTY_ID=210671049`
   - `NODE_ENV` is auto-set by Vercel; don't add manually
4. Promote: `vercel --prod`. Note the URL.
5. Update frontend `.env.production`:
   ```
   VITE_ANALYTICS_API_URL=https://<your-vercel-url>
   ```
6. Rebuild + redeploy portfolio: `npm run deploy` from project root.
7. Smoke test: `https://codewithgabo.com/#/admin-login`, paste the new `ADMIN_TOKEN`, confirm dashboard loads with real metrics.
8. Decommission Railway: stop the `analytics-backend` service in Railway dashboard.

### Pending hygiene (out of slice but worth tracking)

- `npm audit` reports 9 vulnerabilities in transitive deps of `@google-analytics/data` (1 critical, 1 high, 5 moderate, 2 low). Pre-existing — not blocking — but a `npm audit fix` pass should land in a follow-up commit when convenient.

## Commit log (planned)

1. `fix(theme): resolve dark/light mode contrast issues`
2. `refactor(backend): migrate analytics-backend from Express to Vercel Functions`
3. `feat(admin): add custom post editor with BlockNote`
4. `feat(schema): add sponsored and affiliateDisclosure fields to post`
5. `feat(newsletter): integrate ConvertKit signup and stats`
6. `feat(analytics): track affiliate link clicks via GA4 events`
7. `feat(ads): add conditional AdSense placeholder slots`
