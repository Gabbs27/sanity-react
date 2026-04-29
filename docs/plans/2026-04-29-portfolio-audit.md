# Portfolio Audit — codewithgabo.com

**Date:** 2026-04-29
**Status:** Findings only — awaiting user triage before any fixes
**Scope:** Frontend only (public pages + admin). Backend `analytics-backend/` excluded unless it directly affects the public site.

## Constraints (do not violate during fixes)

- `/para-ti` is a personal gift page — never touched, never indexed, never linked publicly.
- AdSense is in review — do **not** modify `index.html`'s AdSense `<script>`, `public/ads.txt`, or the `<meta name="google-adsense-account">` tag. Reviewer crawler may revisit any time.
- Single-admin model (no multi-author / OAuth).
- `VITE_ADSENSE_CLIENT_ID` deliberately unset until AdSense approves — fixes must preserve this conditional behavior.

## TL;DR — top 5 highest-impact findings

1. **No Privacy Policy / Terms / Cookie pages** (P0/M, Area A) — AdSense reviewer will likely flag this. Required for approval.
2. **404 catch-all is broken** (P0/S, Area C) — unknown URLs match `/:slug` (OnePost) instead of `/*` (NotFound) and show "Loading post..." forever.
3. **Hero illustration is 993 KB unoptimized PNG** (P1/S, Area D) — single biggest perf miss; visible on `/gabriel-abreu`. Plus `nobggabo.png` (358 KB) on every page header.
4. **`badge` field never renders on Portfolio** (P1/S, Area B) — three projects (Analytics Dashboard, NegocioRD, A2C) have `badge: "New"` in `data.ts`, the `Card` component renders it, but `Portfolio.tsx` doesn't pass the prop.
5. **Sitemap.xml missing all individual post URLs** (P1/S, Area A+B) — 9 published posts, 0 in sitemap. Hurts SEO and post-level AdSense indexing.

## Methodology

- Read every public component + route definition in `src/`.
- Walked all 10 public routes in dev preview (375px mobile + desktop), captured `h1`, char count, internal links, broken-image count.
- Queried Sanity for post count + word count.
- `npm audit`, `npm outdated`, build size analysis (`build/assets/`).
- Grepped for unused assets and orphaned components.

---

## Area A — AdSense readiness

### A1. No Privacy Policy / Terms / Cookie pages — **P0 / M**
No routes for `/privacy`, `/terms`, `/cookies`. Footer ([src/components/Footer.tsx](src/components/Footer.tsx)) only has copyright + 4 social icons. AdSense reviewers explicitly require a Privacy Policy that mentions third-party cookies (Google + AdSense) for approval.

**Recommendation:** add `/privacy` route at minimum (English + Spanish if bilingual), add link in `Footer.tsx`. A short page (~400 words) covering what Google Analytics + AdSense store, MailerLite for newsletter, and contact email is enough.

### A2. Sitemap.xml missing all blog post URLs — **P1 / S**
[public/sitemap.xml](public/sitemap.xml) lists only 7 static pages. We have 9 published posts in Sanity. `lastmod` dates are also frozen at `2026-02-23`.

**Recommendation:** generate sitemap dynamically at build time from a Sanity GROQ query in a `scripts/generate-sitemap.ts`, run as `prebuild` script. Each post: `<loc>https://codewithgabo.com/<slug></loc>` + real `lastmod`.

### A3. Sitemap missing `/services` and `/education` — **P2 / S**
Both routes exist and render content but aren't in the sitemap.

**Recommendation:** add to the generated sitemap (priority 0.6, monthly).

### A4. Content density is fine — **NO ACTION**
9 published posts, all >500 words. Range: 1,732 – 6,743. Median ~2,500. Well above AdSense "low value content" threshold. Drafts duplicate is normal Sanity behavior, harmless.

### A5. ads.txt + meta tags + CMP correctly configured — **NO ACTION**
[public/ads.txt](public/ads.txt), [index.html:18,23-27](index.html:18) all good. CMP three-option already chosen yesterday.

---

## Area B — Conversion

### B1. Home (`/`) has no newsletter or blog CTA — **P1 / M**
[src/components/Portfolio.tsx](src/components/Portfolio.tsx) shows only a project search input + grid of cards. No prompt to read the blog, subscribe, or contact. The `Greeting` component above it is just bio text.

**Recommendation:** below the project grid, add a small "Latest from the blog" strip (3 most recent posts via Sanity GROQ) and a NewsletterSignup card variant. Already-built components, ~30 LOC of integration.

### B2. `Card` badge never rendered — **P1 / S** (BUG)
[src/components/Portfolio.tsx:52-58](src/components/Portfolio.tsx:52) destructures `image, title, description, url, languages` from project but does not pass `badge`. [src/components/card/Card.tsx:14,20](src/components/card/Card.tsx:14) accepts and renders it, but it's always `undefined`. Three projects have `badge: "New"` set: Analytics Dashboard, NegocioRD, A2C International.

**Recommendation:** add `badge={project.badge}` to the `<Card>` props.

### B3. Newsletter signup is well placed but only on 2 surfaces — **P2 / M**
Currently in: end of every post (`OnePost`), bottom of `/allpost`. NOT on: home, About, Me, Repos, Education, Services, Dashboard demo.

**Recommendation:** add a `card` variant once on home (B1) and consider sticky `inline` variant on About + Me (low effort, small win).

### B4. Affiliate tracking is wired but no affiliate links exist yet — **P2 / NONE**
[src/utils/affiliateTracker.ts](src/utils/affiliateTracker.ts) is installed and listening, [src/config/affiliates.ts](src/config/affiliates.ts) allows `amzn.to`, `amazon.com`, etc. But: 0 actual affiliate links in any post body or page. Tracker fires for nothing.

**Recommendation:** non-code action — author writes posts that include real affiliate links. No code change needed unless deciding to drop the feature.

### B5. AdSense slots conditional and well-placed — **NO ACTION**
[src/components/OnePost.tsx:134,149](src/components/OnePost.tsx:134) — in-article and end-of-post slots. Will activate the moment AdSense approves and `VITE_ADSENSE_CLIENT_ID` is set. Correct.

---

## Area C — UX / visual

### C1. 404 catch-all is broken — **P0 / S** (BUG)
[src/App.tsx:41,73](src/App.tsx:41) — `Route path='/:slug'` catches every unknown single-segment URL **before** the `'*'` NotFound route can match. Visiting any typo (e.g. `/about-us`, `/blog`) shows "Loading post..." forever instead of the 404 page.

**Recommendation:** in `OnePost.tsx`, after the Sanity fetch resolves with no document, render `<NotFound />` instead of staying in loading state. Or list known slugs and `Navigate` to NotFound on miss.

### C2. `/education` is orphaned — **P1 / S**
Route exists, content renders, but [src/components/navheader/NavHeader.tsx](src/components/navheader/NavHeader.tsx) does not link to it. Only reachable by typing the URL.

**Recommendation:** decide — either add to nav (under About or as its own item), or remove the route + component + sitemap entry. Given Education content is brief (866 chars), removing is cleaner unless you want it as a CV substitute.

### C3. Education page uses hardcoded `text-gray-600/800` — **P2 / S**
[src/components/Education.tsx](src/components/Education.tsx) has `text-gray-600` and `text-gray-800` Tailwind classes — invisible on dark backgrounds. Other pages use theme-aware classes.

**Recommendation:** swap for theme-aware tokens (or just use the global text classes the rest of the site uses).

### C4. `/repositorios` route is light (634 chars) — **P2 / NONE-INFO**
Just renders repo cards from a static list. Quality depends on the data, not the UX. Flagging only because it's the lightest content page.

**Recommendation:** none unless adding a "View on GitHub" link that wasn't there.

### C5. NotFound page is essentially empty — **P1 / S**
Only 131 chars when it does render (which is rare due to C1). Per [src/components/NotFound.tsx](src/components/NotFound.tsx), it returns minimal markup.

**Recommendation:** flesh out: heading, helpful message in EN+ES, "Back home" button, "Read latest posts" CTA, search bar. ~30 LOC. Helps both UX and AdSense (reviewer hits a 404 → sees a useful page).

### C6. Mobile layout is clean — **NO ACTION**
375px width: no horizontal scroll, hamburger present, theme toggle works, dark/light switches correctly.

### C7. Dashboard demo has heavy JS (`useAnalyticsData` 392 KB) — **P2 / M**
That file is a recharts-heavy module loaded for `/dashboard-demo`. Public visitors hitting that URL pay 392 KB even though they don't need real data.

**Recommendation:** lazy-import the chart library inside the demo dashboard, or split it into a route-level chunk gated by `useEffect` so the chart code only loads after first interaction. (`React.lazy` on the chart wrapper.)

---

## Area D — Technical health

### D1. Hero illustration `developer-illustration.png` is 993 KB — **P1 / S**
[src/assets/developer-illustration.png](src/assets/developer-illustration.png), used in [src/components/Me.tsx](src/components/Me.tsx) (`/gabriel-abreu`). At ~1 MB it's the biggest single asset on the site.

**Recommendation:** convert to WebP at 80% quality (typically 60–80% size reduction) → ~200 KB. Or AVIF (better) for modern browsers with `<picture>` fallback.

### D2. Greeting illustration `nobggabo.png` is 358 KB on every public page — **P1 / S**
[src/assets/nobggabo.png](src/assets/nobggabo.png) is imported by 3 Greeting variants used in home, posts, and repos. 358 KB on every public page load (ungated by lazy loading).

**Recommendation:** same as D1 — WebP/AVIF, ~75 KB target.

### D3. Six unused image assets totaling ~1+ MB — **P2 / S**
In `src/assets/`: `P-green.png`, `p-red.png`, `github.png`, `github1.png`, `head.png`, `head1.png`. None imported anywhere in `src/`.

**Recommendation:** delete them. Vite tree-shakes unused imports so they don't ship to production, but they bloat the repo and confuse anyone reading the codebase.

### D4. PostEditor chunk is 1.3 MB — **P2 / M**
[src/components/Admin/PostEditor.tsx](src/components/Admin/PostEditor.tsx) pulls in BlockNote + Mantine. It's already lazy-loaded (only fires on `/admin/write`), so public visitors never pay this cost. Flagging because it triggers Vite's chunk-size warning on every build.

**Recommendation:** raise `build.chunkSizeWarningLimit` in `vite.config.ts` to 1500 to suppress the warning, OR split BlockNote toolbar/editor with their own dynamic imports. Low priority — only authors see it.

### D5. `npm audit` — 1 moderate vuln (`follow-redirects`) — **P2 / S**
Transitive dep of axios. Auto-fixable.

**Recommendation:** `npm audit fix`. If it bumps a major, evaluate; otherwise commit.

### D6. Several minor outdated deps — **P2 / S**
Most are bug-fix bumps within current major (FontAwesome 7.1→7.2, Sanity 7.14→7.22, Vite 6.4.1→6.4.2). Two have new majors available — skip those:
- `react-ga4` 2.1.0 → 3.0.1 (major; current works fine, defer)
- `react-helmet-async` 2.0.5 → 3.0.0 (major; defer)
- `typescript` 5.9 → 6.0 (major; defer)
- `@portabletext/react` warns "wanted 6.0.3, latest 4.0.3" — `4` is the actual current line; `6` was a misnumbered alpha. Stay on 6.0.x.

**Recommendation:** `npm update` for the safe bumps. Skip majors until next deliberate upgrade pass.

### D7. `console.log/warn` calls in 5 files — **P2 / S** (NOISE-INFO)
Mostly debug statements in trackers / utility code. No PII or secrets, but they ship to production.

**Recommendation:** keep `console.warn` for the AdSlot push catch (genuinely useful in production). Strip `console.log` in `src/utils/affiliateTracker.ts` and similar — replace with no-op or a tiny `debug()` helper gated by `import.meta.env.DEV`.

---

## Quick wins — small effort, high impact (do these first)

These are all P0 or P1 with **S** effort (≤30 min each):

1. **C1**: Fix 404 catch-all (return NotFound from OnePost on miss)
2. **B2**: Pass `badge` prop in Portfolio.tsx
3. **C5**: Flesh out NotFound page
4. **D3**: Delete 6 unused image assets
5. **D5**: `npm audit fix`
6. **A3**: Add `/services`, `/education` to sitemap (or remove `/education` per C2)

Bundled, that's ~1.5h of focused work and meaningfully improves AdSense-readiness, UX, and repo cleanliness in one shot.

## Medium-effort wins (do after quick wins)

These are P0/P1 with **M** effort (1–3h each):

7. **A1**: Privacy Policy page + Footer link
8. **A2**: Dynamic sitemap from Sanity at build time
9. **B1**: Home blog strip + newsletter card
10. **D1+D2**: Convert hero PNGs to WebP

## Considered and dropped

- **/para-ti page** — explicit user constraint, do not touch.
- **/services lightening** — page is functional and has a real purpose; light content count alone is not a defect.
- **PostEditor bundle splitting (D4)** — admin-only, only the author pays the cost. Diminishing returns.
- **Removing `console.warn` in AdSlot** — genuinely informative in production when AdSense errors during push. Keep.
- **Dashboard/dashboard duplicate folder** — initially flagged; turned out to be a macOS APFS case-insensitive grep artifact. Git tracks only `Dashboard/`. Not a real bug.

## Constraints anotados (recap)

- `/para-ti` no se toca.
- AdSense en review → no romper script ni `ads.txt` ni `<meta name="google-adsense-account">`.
- Single-admin model (no auth changes).
- `VITE_ADSENSE_CLIENT_ID` debe permanecer unset hasta aprobación oficial.

---

## Next step

User reads this, picks which findings to attack and in what order. Each chosen finding becomes a slice in a separate writing-plans pass before any code is touched.
