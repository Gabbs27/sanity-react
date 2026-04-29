# Portfolio Audit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve all 17 findings from [2026-04-29-portfolio-audit.md](2026-04-29-portfolio-audit.md) across 8 deployable slices.

**Architecture:** Each slice is one commit, one cohesive change, independently deployable to GitHub Pages. No new infrastructure — the work is React component edits, asset replacements, a Node prebuild script for the sitemap, and surgical deletions. AdSense, CMP, and ads.txt are explicitly **untouched** to avoid disturbing the in-progress AdSense review.

**Tech Stack:** React 18, Vite 6, TypeScript 5.9, Tailwind 4, Sanity (existing), GitHub Pages (gh-pages). No test runner per project policy — verification is via Claude_Preview MCP browser walkthrough + visual inspection + computed-style checks. Each slice ends with explicit verification commands and a commit.

**Per-slice contract:**
- Read the audit finding(s) the slice covers.
- Make edits.
- Run dev server (already running on port 3000 via preview MCP, server `277dab8b-...`).
- Verify in preview per the slice's verification block.
- `git commit` (NO `Co-Authored-By` trailer — user preference).
- Stop. Wait for next slice approval. Do **not** deploy until user explicitly says so.

**Slice ordering rationale:**
- Hygiene first (zero feature risk, sets clean baseline).
- Critical UX bugs (404, badge) before adding features.
- Sitemap before Privacy (so the new page is auto-included).
- Visual polish last (depends on stable structure).

---

## Slice 1 — Hygiene cleanup

**Audit findings covered:** D3 (unused assets), D5 (npm audit fix), D6 (safe dep bumps), D7 (strip dev console.log), D4 (chunk warning).

**Files:**
- Delete: `src/assets/P-green.png`
- Delete: `src/assets/p-red.png`
- Delete: `src/assets/github.png`
- Delete: `src/assets/github1.png`
- Delete: `src/assets/head.png`
- Delete: `src/assets/head1.png`
- Modify: `package.json` + `package-lock.json` (via npm)
- Modify: `vite.config.ts` (raise chunkSizeWarningLimit)
- Modify: `src/utils/affiliateTracker.ts` (gate console.log behind `import.meta.env.DEV`)

### Step 1.1 — Delete unused assets

Run:
```bash
git rm src/assets/P-green.png src/assets/p-red.png src/assets/github.png src/assets/github1.png src/assets/head.png src/assets/head1.png
```

Expected: 6 files staged for deletion.

### Step 1.2 — Apply safe dep bumps + audit fix

Run:
```bash
npm audit fix
npm update @fortawesome/fontawesome-svg-core @fortawesome/free-brands-svg-icons @fortawesome/free-regular-svg-icons @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome @sanity/client @sanity/image-url @tailwindcss/vite @types/node @types/react motion react react-dom react-is react-router-dom react-syntax-highlighter recharts tailwindcss vite
```

Expected: lockfile updated, no major version bumps. **Skip** `react-ga4`, `react-helmet-async`, `typescript`, `@portabletext/react` — these have major-version traps documented in the audit.

### Step 1.3 — Raise chunk-size warning limit

Edit `vite.config.ts`. In the `build` config block (create one if absent), add:
```ts
build: {
  chunkSizeWarningLimit: 1500,
}
```

### Step 1.4 — Gate console.log behind DEV in affiliateTracker

Edit `src/utils/affiliateTracker.ts`. Replace any `console.log(...)` calls with:
```ts
if (import.meta.env.DEV) console.log(...);
```

Keep `console.warn` calls intact (they're useful in production for AdSense/tracking failures).

### Step 1.5 — Verify

Run:
```bash
npm run build 2>&1 | tail -5
```

Expected: build succeeds, no chunk-size warning, total time < 10s.

Reload preview (`window.location.reload()` via preview_eval) and check:
- Home `/` renders normally
- A blog post `/tailwind-css` renders normally
- Console: no errors

### Step 1.6 — Commit

```bash
git add -A && git commit -m "chore: hygiene cleanup (unused assets, dep bumps, audit fix, dev-gated logs)

Removes 6 unused PNGs in src/assets, applies npm audit fix, bumps safe
patch versions of FontAwesome/Sanity/Vite/Tailwind/etc, raises Vite
chunk-size warning limit to 1500 (PostEditor is admin-only and lazy
loaded), and gates console.log calls in affiliateTracker behind
import.meta.env.DEV."
```

---

## Slice 2 — Fix Portfolio badge bug (B2)

**Audit finding covered:** B2 — `Card` accepts a `badge` prop but Portfolio.tsx doesn't pass it.

**Files:**
- Modify: `src/components/Portfolio.tsx:52-58`

### Step 2.1 — Pass badge prop

Edit `src/components/Portfolio.tsx`. Find:
```tsx
<Card
  image={project.image}
  title={project.title}
  description={project.description}
  url={project.url}
  languages={project.languages}
/>
```

Add `badge` line:
```tsx
<Card
  image={project.image}
  title={project.title}
  description={project.description}
  url={project.url}
  languages={project.languages}
  badge={project.badge}
/>
```

### Step 2.2 — Verify

In preview, navigate to `/`. Expect three cards to show a "New" badge: Analytics Dashboard (id 0), NegocioRD (id 1), A2C International (id 8).

```js
// preview_eval
Array.from(document.querySelectorAll('.card-badge')).map(el => el.textContent.trim())
// Expected: ["New", "New", "New"]
```

### Step 2.3 — Commit

```bash
git add src/components/Portfolio.tsx && git commit -m "fix(portfolio): pass badge prop to Card so 'New' tag actually renders

The Card component already supports a badge field but Portfolio.tsx
forgot to forward it. Three projects with badge: 'New' in data.ts
(Analytics Dashboard, NegocioRD, A2C International) now show the pill."
```

---

## Slice 3 — Proper 404 / NotFound handling (C1 + C5)

**Audit findings covered:** C1 (404 catch-all broken — unknown URLs hit `/:slug` and stick on "Loading post..."), C5 (NotFound page is essentially empty).

**Files:**
- Modify: `src/components/OnePost.tsx` (render NotFound when Sanity returns no doc)
- Modify: `src/components/NotFound.tsx` (flesh out)

### Step 3.1 — Read current state

Read `src/components/OnePost.tsx` and `src/components/NotFound.tsx` fully before editing. Identify:
- How OnePost handles the "no document found" case today.
- What NotFound currently renders.

### Step 3.2 — Make OnePost detect missing post

In `OnePost.tsx`, after the Sanity fetch resolves, distinguish "still loading" from "loaded but empty". Track a separate state (e.g. `notFound: boolean`). When the GROQ query returns `[]`, set `notFound = true`. In render, if `notFound`, return `<NotFound />` instead of the loading skeleton.

Pattern:
```tsx
const [postData, setPostData] = useState<SanityPostData | null>(null);
const [notFound, setNotFound] = useState(false);

useEffect(() => {
  sanityClient
    .fetch(/* existing query */, { slug })
    .then((data: SanityPostData[]) => {
      if (data.length === 0) setNotFound(true);
      else setPostData(data[0]);
    })
    .catch(() => setNotFound(true));
}, [slug]);

if (notFound) return <NotFound />;
if (!postData) return <LoadingSpinner message="Loading post..." />;
```

### Step 3.3 — Flesh out NotFound page

Edit `src/components/NotFound.tsx`. Target structure (~30 LOC):
- H1: "Page not found" (EN) / "Página no encontrada" (ES, smaller below)
- Brief copy: "This URL doesn't match any page on the site. Maybe one of these helps:"
- Three CTAs (use existing button styles): "Back home" → `/`, "Read latest posts" → `/allpost`, "About me" → `/about`
- Use `SEO` component to set `<title>` to "404 – Page not found"

Reuse existing classes from `src/index.css` / Tailwind. Keep dark/light theme aware.

### Step 3.4 — Verify

In preview:
1. Navigate to `/this-does-not-exist` → expect NotFound page (not "Loading post...")
2. Navigate to `/tailwind-css` → real post still renders
3. Navigate to `/` → home still renders
4. Toggle theme → NotFound readable in both modes

```js
// preview_eval after navigating to /this-does-not-exist
({ h1: document.querySelector('h1')?.textContent, hasBackHome: !!document.querySelector('a[href="/"]') })
```

### Step 3.5 — Commit

```bash
git add src/components/OnePost.tsx src/components/NotFound.tsx && git commit -m "fix(routing): render NotFound for unknown URLs and flesh out 404 page

OnePost now distinguishes 'still loading' from 'no such slug' and
renders NotFound when Sanity returns no document. NotFound itself
gets a real layout: heading, helpful copy, and CTAs to home, blog,
and about. Fixes the issue where /typo would hang on 'Loading post...'"
```

---

## Slice 4 — Dynamic sitemap from Sanity (A2 + A3)

**Audit findings covered:** A2 (sitemap missing all post URLs), A3 (sitemap missing /services and /education).

**Files:**
- Create: `scripts/generate-sitemap.mjs`
- Modify: `package.json` (add `prebuild` script)
- Modify: `public/sitemap.xml` (auto-regenerated; can leave as committed snapshot)

### Step 4.1 — Write generate-sitemap.mjs

Create `scripts/generate-sitemap.mjs` that:
1. Imports `@sanity/client`
2. Queries `*[_type=="post" && !(_id in path("drafts.**"))]{slug, _updatedAt}`
3. Combines with the static routes list:
   - `/` (priority 1.0, weekly)
   - `/about` (0.8, monthly)
   - `/allpost` (0.9, weekly)
   - `/gabriel-abreu` (0.7, monthly)
   - `/repositorios` (0.6, monthly)
   - `/services` (0.7, monthly) — NEW
   - `/education` (0.6, monthly) — NEW
   - `/privacy` (0.5, yearly) — placeholder for slice 6 (script will tolerate the route not existing yet; slice 6 just confirms the URL is included)
   - Each post slug at priority 0.8, monthly, with real `_updatedAt`
4. Writes XML to `public/sitemap.xml`.

Skeleton:
```js
import { createClient } from '@sanity/client';
import { writeFileSync } from 'fs';

const client = createClient({
  projectId: 'nnt7ytcd',
  dataset: 'production',
  apiVersion: '2023-03-01',
  useCdn: true,
});

const posts = await client.fetch(`*[_type=="post" && !(_id in path("drafts.**"))]{slug, _updatedAt}`);

const staticRoutes = [
  { path: '/',              priority: 1.0, freq: 'weekly'  },
  { path: '/about',         priority: 0.8, freq: 'monthly' },
  { path: '/allpost',       priority: 0.9, freq: 'weekly'  },
  { path: '/gabriel-abreu', priority: 0.7, freq: 'monthly' },
  { path: '/repositorios',  priority: 0.6, freq: 'monthly' },
  { path: '/services',      priority: 0.7, freq: 'monthly' },
  { path: '/education',     priority: 0.6, freq: 'monthly' },
  { path: '/privacy',       priority: 0.5, freq: 'yearly'  },
];

const today = new Date().toISOString().slice(0, 10);

const urls = [
  ...staticRoutes.map(r => ({ loc: `https://codewithgabo.com${r.path}`, lastmod: today, changefreq: r.freq, priority: r.priority })),
  ...posts.map(p => ({ loc: `https://codewithgabo.com/${p.slug.current}`, lastmod: p._updatedAt.slice(0,10), changefreq: 'monthly', priority: 0.8 })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

writeFileSync('public/sitemap.xml', xml);
console.log(`Sitemap generated with ${urls.length} URLs.`);
```

### Step 4.2 — Add prebuild script

Edit `package.json` `scripts`:
```json
"prebuild": "node scripts/generate-sitemap.mjs",
```

### Step 4.3 — Run once and inspect

```bash
node scripts/generate-sitemap.mjs
```

Expected output: `Sitemap generated with N URLs.` where N is 8 static + post count (currently 9).

Open `public/sitemap.xml` and verify:
- Contains `<loc>https://codewithgabo.com/tailwind-css</loc>` (a known post)
- Contains `<loc>https://codewithgabo.com/services</loc>`
- Contains `<loc>https://codewithgabo.com/education</loc>`
- All `lastmod` dates are real (not all the same frozen date)

### Step 4.4 — Verify build still works

```bash
npm run build 2>&1 | tail -8
```

Expected: prebuild fires the sitemap generator, then Vite builds, all succeed.

### Step 4.5 — Commit

```bash
git add scripts/generate-sitemap.mjs package.json package-lock.json public/sitemap.xml && git commit -m "feat(seo): generate sitemap from Sanity at build time

Adds scripts/generate-sitemap.mjs running as prebuild. Pulls all
non-draft posts via GROQ and combines with the static route list
(now including /services, /education, and a /privacy placeholder
ahead of slice 6). lastmod is real (post _updatedAt or today)."
```

---

## Slice 5 — /education polish (C2 + C3)

**Audit findings covered:** C2 (orphaned route — not in nav), C3 (Education uses dark-mode-hostile `text-gray-600/800`).

**Decision:** ADD `/education` to the nav (rather than removing). It's a CV/credentials page, fits naturally next to About, and the data already exists. Removal would only save ~30 LOC but lose a legitimate portfolio surface.

**Files:**
- Modify: `src/components/navheader/NavHeader.tsx` (add NavLink)
- Modify: `src/components/Education.tsx` (theme-aware text classes)

### Step 5.1 — Add nav link

Edit `src/components/navheader/NavHeader.tsx`. Find the existing NavLink for `/about` and insert one for `/education` either right after `/about` or between `/repositorios` and `/dashboard` — whichever matches visual hierarchy. Match the existing className.

```tsx
<NavLink to="/education" className="...same className as siblings...">
  Education
</NavLink>
```

### Step 5.2 — Fix theme-hostile classes

Edit `src/components/Education.tsx`. Replace:
- `text-gray-600` → `text-gray-600 dark:text-gray-400` (or whatever pattern the rest of the site uses — confirm by grepping for `dark:text-` in `About.tsx` first)
- `text-gray-800` → `text-gray-800 dark:text-gray-200`
- `border` (no color) → check it's visible in dark mode; add `border-gray-200 dark:border-gray-700` if needed.

### Step 5.3 — Verify

In preview:
1. Navigate to `/education` in **dark** mode → text is readable, period/location/description all visible.
2. Toggle to light mode → still readable, contrast OK.
3. Navigate to `/` → click the new "Education" nav link → lands on `/education`.

```js
// preview_eval
const p = document.querySelector('.text-gray-600, .text-gray-800');
({ color: p && getComputedStyle(p).color, theme: document.documentElement.className });
```

### Step 5.4 — Commit

```bash
git add src/components/navheader/NavHeader.tsx src/components/Education.tsx && git commit -m "feat(nav): expose /education + fix dark-mode contrast on Education page

Adds Education to the main nav (was orphaned, only reachable by direct
URL). Replaces hardcoded text-gray-600/800 with theme-aware variants
so the page is readable in both modes."
```

---

## Slice 6 — Privacy Policy + Footer link (A1)

**Audit finding covered:** A1 — no Privacy Policy page (AdSense reviewer requirement).

**Files:**
- Create: `src/components/Privacy.tsx`
- Modify: `src/App.tsx` (add `/privacy` route)
- Modify: `src/components/Footer.tsx` (link to `/privacy`)

### Step 6.1 — Author the Privacy page

Create `src/components/Privacy.tsx`. Single-page bilingual layout (Spanish primary, English collapsed below or side-by-side — match the audience pattern in Newsletter signup which is Spanish-first).

Content sections to cover (each a short paragraph):
1. **Who we are** — name, contact email (use `fco.g.abreu@gmail.com` — already public in Me.tsx).
2. **Data we collect**:
   - Google Analytics 4 (anonymous page views, device/country aggregates).
   - Google AdSense cookies (ad personalization, frequency capping). Mention CMP banner for EEA/UK/CH.
   - MailerLite (only if user submits the newsletter form — name + email).
   - No accounts, no payments, no profiling beyond AdSense's standard.
3. **Cookies** — list categories (analytics, advertising, functional). Reference the CMP for granular control.
4. **Data retention** — analytics 26 months (GA4 default), newsletter until unsubscribe.
5. **Third parties** — Google (Analytics + AdSense), MailerLite, Sanity (CMS, no PII).
6. **Your rights** (GDPR + Dominican law) — access, rectification, deletion. Email above for requests.
7. **Affiliate links disclosure** — site contains affiliate links; clicking may earn a commission at no cost to the user. Compliance with FTC + EU.
8. **Updates** — last updated date at the top.

Use `SEO` component to set `<title>Privacy Policy | Code With Gabo</title>` and `description`.

Style: reuse existing Tailwind prose-style patterns. Theme aware. Min reading width.

### Step 6.2 — Wire route

Edit `src/App.tsx`. After the `/services` route (before the dashboard demo), add:
```tsx
<Route element={<Privacy />} path='/privacy' />
```

Add the lazy import at the top with the other lazy components:
```tsx
const Privacy = lazy(() => import("./components/Privacy"));
```

### Step 6.3 — Add footer link

Edit `src/components/Footer.tsx`. Above or beside the social icons, add:
```tsx
<div className='footer--links'>
  <Link to="/privacy" className="footer-link">Privacy Policy</Link>
</div>
```

Add `Link` import from `react-router-dom` if not present.

If `footer-link` class doesn't exist, add minimal CSS in the same file's CSS module (or inline style if no CSS file) — match the muted text color of the copyright line.

### Step 6.4 — Verify

In preview:
1. Navigate to `/privacy` → page renders, all sections visible, theme-aware.
2. Navigate to `/` → scroll to footer → click "Privacy Policy" link → lands on `/privacy`.
3. View page source / `document.title` → "Privacy Policy | Code With Gabo".
4. Check sitemap (regenerated by slice 4): `/privacy` is included.

### Step 6.5 — Commit

```bash
git add src/components/Privacy.tsx src/App.tsx src/components/Footer.tsx && git commit -m "feat(legal): add Privacy Policy page and link from footer

Required by AdSense reviewers — covers GA4, AdSense (with CMP),
MailerLite, cookies, data retention, GDPR/FTC rights, and the
affiliate disclosure. Linked from the global footer. Lazy-loaded
route to avoid bloating the main bundle."
```

---

## Slice 7 — Home conversion CTAs (B1)

**Audit finding covered:** B1 — home has no newsletter / blog CTA.

**Files:**
- Modify: `src/components/Portfolio.tsx` (add latest-posts strip + newsletter card below grid)

### Step 7.1 — Fetch latest posts

In `Portfolio.tsx`, add a second `useEffect` (or merge into the existing one) that fetches:
```groq
*[_type=="post" && !(_id in path("drafts.**"))] | order(publishedAt desc)[0...3]{
  title, slug, mainImage{asset->{url}}, publishedAt
}
```
Store in `latestPosts` state.

### Step 7.2 — Render strip below project grid

Below the existing `<div className='grid md:...'>` block, add a new section:
```tsx
{latestPosts.length > 0 && (
  <AnimatedSection variant="fadeIn" duration={0.6}>
    <section className="mt-16">
      <h2 className="text-3xl font-bold mb-8">Latest from the blog</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {latestPosts.map(p => (
          <Link key={p.slug.current} to={`/${p.slug.current}`} className="...post-card classes...">
            {p.mainImage && <img src={p.mainImage.asset.url} alt={p.title} />}
            <h3>{p.title}</h3>
            <time>{new Date(p.publishedAt).toLocaleDateString()}</time>
          </Link>
        ))}
      </div>
      <div className="text-center mt-8">
        <Link to="/allpost" className="...button class...">View all posts →</Link>
      </div>
    </section>
  </AnimatedSection>
)}
```

Reuse classes from existing PostCard if possible to keep visual consistency.

### Step 7.3 — Newsletter card below

Below the latest-posts section, render the existing reusable component:
```tsx
<AnimatedSection variant="fadeIn" duration={0.6}>
  <section className="mt-16">
    <NewsletterSignup variant="card" />
  </section>
</AnimatedSection>
```

Add the import.

### Step 7.4 — Verify

In preview:
1. Navigate to `/` → scroll past project grid → see "Latest from the blog" with 3 cards.
2. Click one card → lands on the post.
3. Scroll further → see Newsletter signup card.
4. Submit a test email (don't worry, MailerLite double opt-in won't actually subscribe without confirmation) → check the loading/success state fires.

### Step 7.5 — Commit

```bash
git add src/components/Portfolio.tsx && git commit -m "feat(home): add latest-posts strip and newsletter CTA below project grid

Home was previously a project search + grid only. Adds a 3-post
preview pulled from Sanity (newest first) and the existing
NewsletterSignup card variant beneath. Both reuse existing
components — no new infrastructure."
```

---

## Slice 8 — Image optimization (D1 + D2)

**Audit findings covered:** D1 (`developer-illustration.png` 993 KB), D2 (`nobggabo.png` 358 KB on every page).

**Files:**
- Create: `src/assets/developer-illustration.webp` (converted)
- Create: `src/assets/nobggabo.webp` (converted)
- Modify: `src/components/Me.tsx` (import .webp instead of .png)
- Modify: `src/components/Greeting/Greeting.tsx`, `Greeting/PostGreeting.tsx`, `Greeting/ReposGreeting.tsx` (import .webp)
- Delete: original `.png` versions if no other consumer remains.

### Step 8.1 — Convert PNGs to WebP

macOS has `cwebp` if `webp` Homebrew package is installed; otherwise use `sips` (built-in) which doesn't do WebP, so prefer `cwebp`.

Check:
```bash
which cwebp || brew list webp 2>&1 | head -1
```

If missing: `brew install webp`.

Convert (quality 80, no alpha lossless if alpha exists):
```bash
cwebp -q 80 src/assets/developer-illustration.png -o src/assets/developer-illustration.webp
cwebp -q 80 src/assets/nobggabo.png -o src/assets/nobggabo.webp
ls -lh src/assets/*.webp
```

Expected: ~150–250 KB for developer-illustration.webp, ~75–120 KB for nobggabo.webp.

### Step 8.2 — Update imports

Edit each file that imports the PNG and change the path to `.webp`:
- `src/components/Me.tsx:4` → `import p from "../assets/developer-illustration.webp";`
- `src/components/Greeting/Greeting.tsx:4` → `import p from "../../assets/nobggabo.webp";`
- `src/components/Greeting/PostGreeting.tsx:4` → `import p from "../../assets/nobggabo.webp";`
- `src/components/Greeting/ReposGreeting.tsx:4` → `import p from "../../assets/nobggabo.webp";`

### Step 8.3 — Confirm no remaining consumers, then delete PNGs

```bash
grep -rn "developer-illustration.png\|nobggabo.png" src/ --include="*.tsx" --include="*.ts" --include="*.css"
```

Expected: no results. Then:
```bash
git rm src/assets/developer-illustration.png src/assets/nobggabo.png
```

### Step 8.4 — Verify

In preview:
1. Navigate to `/` → home illustration renders (the Greeting image).
2. Navigate to `/gabriel-abreu` → developer illustration renders.
3. Navigate to `/allpost` and a post → header illustration renders.

```js
// preview_eval
Array.from(document.querySelectorAll('img')).filter(i => i.src.includes('webp')).map(i => ({ w: i.naturalWidth, h: i.naturalHeight, complete: i.complete }))
// Expected: at least one entry with naturalWidth > 0 and complete: true
```

Run a build and check sizes:
```bash
npm run build 2>&1 | grep -E "developer-illustration|nobggabo"
```

Expected: only `.webp` entries in the output, both significantly smaller than their PNG predecessors.

### Step 8.5 — Commit

```bash
git add -A && git commit -m "perf(images): convert hero illustrations from PNG to WebP

developer-illustration.png (993 KB) and nobggabo.png (358 KB) are
the two heaviest assets on public pages. Converted both to WebP at
quality 80 — roughly 75% size reduction with no visible quality
difference. nobggabo loads on every public page (Greeting variants),
so the savings compound."
```

---

## Slice 9 — Lazy-load chart library in /dashboard-demo (C7)

**Audit finding covered:** C7 — `useAnalyticsData` chunk is 392 KB (recharts) loaded eagerly when the demo dashboard route is hit.

**Files:**
- Modify: `src/components/Dashboard/DashboardDemo.tsx` (lazy-import the recharts wrapper or split into a separate component)

### Step 9.1 — Identify the heavy import

Read `src/components/Dashboard/DashboardDemo.tsx` and `ChartCard.tsx`. Identify which imports pull `recharts`. Likely `ChartCard` or a sub-component.

### Step 9.2 — Lazy-load the chart wrapper

Wrap the recharts-dependent component in `React.lazy`. Pattern:
```tsx
import { lazy, Suspense } from 'react';
const ChartCard = lazy(() => import('./ChartCard'));

// In JSX:
<Suspense fallback={<div className="chart-skeleton" />}>
  <ChartCard {...props} />
</Suspense>
```

If `ChartCard` is consumed by both `Dashboard` and `DashboardDemo` and they're both lazy at the route level, this slice may have minimal effect — flag and skip if so. The win comes from delaying the recharts module until ChartCard mounts.

### Step 9.3 — Verify

```bash
npm run build 2>&1 | grep -E "useAnalyticsData|ChartCard|recharts" | head -10
```

Compare chunk sizes to before. The main demo chunk should shrink; a new chunk for the chart should appear.

In preview, navigate to `/dashboard-demo`. Charts should still render (after a brief skeleton on slow connections).

### Step 9.4 — Commit

```bash
git add src/components/Dashboard/DashboardDemo.tsx && git commit -m "perf(dashboard): lazy-load chart library in demo dashboard

recharts (~392 KB) was loaded eagerly when /dashboard-demo mounted.
Wrapping the ChartCard in React.lazy + Suspense defers it until the
chart actually mounts. Public visitors who briefly land on the demo
page now pay less if they bounce before charts paint."
```

---

## Final verification (after all slices)

After Slice 9 commits:

1. `npm run build` — succeeds, no warnings, all chunks accounted for.
2. Walk public routes in preview: `/`, `/allpost`, a post, `/about`, `/gabriel-abreu`, `/repositorios`, `/services`, `/education`, `/dashboard-demo`, `/privacy`, `/this-is-not-a-real-route`. Each renders correctly in dark + light mode.
3. `git log --oneline -12` — confirm 9 new clean commits, no Co-Authored-By trailers, scoped messages.
4. `npm run deploy` — only when user explicitly approves the full set.

## Slice dependencies

- Slices 1, 2, 3, 5, 8, 9: independent.
- Slice 4 should run **before** Slice 6 (so the `/privacy` URL gets included by the dynamic generator). Workaround: the script already lists `/privacy` as a static entry, so even if user runs them out of order it's fine — Slice 6 just makes the URL serve real content.
- Slice 7 reuses NewsletterSignup which already exists; no dependency.

## Rollback per slice

Each slice is one commit. Rollback = `git revert <hash>` and `npm run deploy`. No state migrations, no DB writes, no env-var changes — purely frontend file edits and one prebuild script.

---

## Execution handoff

Plan complete and saved to `docs/plans/2026-04-29-portfolio-audit-implementation.md`. Two execution options:

**1. Subagent-Driven (this session)** — I dispatch a fresh subagent per slice, review the diff, you approve before commit. Slow but careful.

**2. Inline (this session, no subagents)** — I execute slice by slice myself, verify each in preview, commit each, you confirm "next" between slices. Faster, more direct.

Given the volume (9 slices, mostly mechanical), **inline** is probably the right call here unless you want a code-review checkpoint between every commit.
