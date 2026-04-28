# Slice 6 — Affiliate-link click tracking

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Capture every click on a known affiliate link as a GA4 custom event, then surface a "top affiliate domains by clicks" widget on the admin dashboard. No new database, no dedicated endpoint — just GA4 events end-to-end.

**Architecture:**
- Frontend installs ONE delegated click listener on `document` at app boot. The listener walks up from the click target, finds the nearest `<a>`, checks if its hostname matches an allowlist, and (on match) calls `window.gtag('event', 'affiliate_click', { link_domain, link_url, link_text })`.
- Allowlist lives in `src/config/affiliates.ts` so adding new programs is trivial.
- The existing GA4 backend (`analytics-backend/api/analytics.js`) gets one extra query that pulls the `affiliate_click` event aggregated by the `link_domain` event parameter, returned alongside the rest of the dashboard payload.
- New `<AffiliateCard />` reads the same `useAnalyticsData` hook the dashboard already uses; no fetching duplication.

**Tech stack:** No new deps. `window.gtag` is already injected by the GA4 snippet in `index.html`.

**Branch:** `developer`. Working tree clean.

---

## Task 1: `src/config/affiliates.ts`

**Files:** Create new file.

```ts
/**
 * Affiliate-link allowlist.
 *
 * Each entry is a domain (or hostname suffix) we treat as an affiliate
 * partner. A click on any anchor whose hostname EITHER matches one of
 * these entries exactly OR ends with `.${entry}` is reported to GA4 as
 * an `affiliate_click` event.
 *
 * To add a new program: append the canonical hostname (no protocol,
 * no path). Subdomains (`a.b.example.com`) are matched automatically
 * via the suffix rule, so listing `example.com` is enough.
 */
export const AFFILIATE_DOMAINS: readonly string[] = [
  // Amazon Associates
  'amzn.to',
  'amzn.eu',
  'amzn.in',
  'amazon.com',
  'amazon.es',
  'amazon.com.mx',
  // Add more as you sign up: e.g. 'partner.canva.com', 'sovrn.co', etc.
] as const;

export function isAffiliate(hostname: string): boolean {
  if (!hostname) return false;
  const h = hostname.toLowerCase();
  return AFFILIATE_DOMAINS.some(
    (entry) => h === entry || h.endsWith(`.${entry}`)
  );
}
```

**Commit message:** `feat(analytics): add affiliate domain allowlist`

---

## Task 2: `src/utils/affiliateTracker.ts`

**Files:** Create new file.

```ts
import { isAffiliate } from '../config/affiliates';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GtagFn = (...args: any[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
  }
}

/**
 * Find the nearest ancestor <a> for a given DOM node, or null.
 * Implemented as a small loop instead of `closest('a')` to keep
 * behaviour predictable on shadow-DOM-free pages.
 */
function findAnchor(node: EventTarget | null): HTMLAnchorElement | null {
  let el: Node | null = node as Node | null;
  while (el && el.nodeType === 1) {
    if ((el as HTMLElement).tagName === 'A') {
      return el as HTMLAnchorElement;
    }
    el = (el as HTMLElement).parentElement;
  }
  return null;
}

/**
 * Install a single delegated click listener that fires a GA4
 * `affiliate_click` event whenever an anchor pointing at one of the
 * allowlisted hostnames is activated.
 *
 * Returns an `uninstall` function so tests / hot-reload can clean up.
 */
export function installAffiliateTracker(): () => void {
  const handler = (e: MouseEvent) => {
    // Ignore non-primary clicks (middle/right) and modifier-augmented
    // clicks — those are already handled by the browser as new-tab
    // navigations and we still want them tracked, so DON'T return here.
    const a = findAnchor(e.target);
    if (!a || !a.href) return;

    let url: URL;
    try {
      url = new URL(a.href);
    } catch {
      return; // mailto:, javascript:, etc.
    }

    if (!isAffiliate(url.hostname)) return;

    const gtag = window.gtag;
    if (typeof gtag !== 'function') return;

    gtag('event', 'affiliate_click', {
      link_domain: url.hostname,
      link_url: a.href,
      link_text: (a.textContent || '').trim().slice(0, 80),
      // Default outbound flag mirrors GA4's built-in click event so
      // GA's automatic enhanced-measurement reports stay consistent.
      outbound: true,
    });
  };

  document.addEventListener('click', handler, { capture: true });
  return () => document.removeEventListener('click', handler, { capture: true });
}
```

**Commit message:** `feat(analytics): track affiliate link clicks via delegated listener`

---

## Task 3: Boot the tracker in `index.tsx`

**Files:** Modify `src/index.tsx`.

Add the import and a single call near the existing service worker registration.

```ts
import { installAffiliateTracker } from "./utils/affiliateTracker";

// ...existing render code...

installAffiliateTracker();
```

(Place the call AFTER `root.render(...)` and BEFORE `serviceWorkerRegistration.register(...)` to keep the boot sequence readable.)

**Commit message:** `feat(analytics): install affiliate tracker on app boot`

---

## Task 4: Extend backend `api/analytics.js` with affiliate query

**Files:** Modify `analytics-backend/api/analytics.js` and `analytics-backend/api/_utils/ga4.js`.

### Step 4.1: Add the GA4 query block

Inside `api/analytics.js`, after the `realtimeResponse` query, add:

```js
const [affiliateResponse] = await client.runReport({
  property: `properties/${propertyId}`,
  dateRanges: [{ startDate, endDate }],
  dimensions: [{ name: 'eventName' }, { name: 'customEvent:link_domain' }],
  metrics: [{ name: 'eventCount' }],
  dimensionFilter: {
    filter: {
      fieldName: 'eventName',
      stringFilter: { value: 'affiliate_click', matchType: 'EXACT' },
    },
  },
  orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
  limit: 10,
});
```

Then pass it into the formatter call:
```js
const formatted = formatAnalyticsData({
  ...,
  affiliate: affiliateResponse,
});
```

### Step 4.2: Extend formatter in `_utils/ga4.js`

Add to `formatAnalyticsData`:

```js
const affiliateData = (responses.affiliate?.rows || []).map((row) => ({
  domain: row.dimensionValues[1]?.value || 'unknown',
  clicks: parseInt(row.metricValues[0].value),
})).filter((r) => r.domain && r.domain !== '(not set)');
```

And include `affiliateClicks: affiliateData` in the returned object.

**IMPORTANT:** `customEvent:link_domain` only works if the GA4 property has `link_domain` registered as a custom event parameter / dimension. If not, the API call will succeed but return zero rows — **the dashboard widget should handle the empty case gracefully**. (See Task 5.)

The user may need to register `link_domain` (and `link_url`, `link_text`) as event-scoped Custom Definitions in their GA4 property: Admin → Custom definitions → Create custom dimensions. We surface this in the README; not blocking deployment of this slice.

**Commit message:**
```
feat(analytics): add affiliate_click events to dashboard payload

Backend GA4 wrapper now runs an extra report querying the
affiliate_click custom event grouped by the link_domain custom
parameter, ordered by event count. Results are returned in the
dashboard response under affiliateClicks: [{domain, clicks}].

Note: link_domain must be registered as a GA4 Custom Dimension
(Admin → Custom definitions → Custom dimensions, event scope) for
the breakdown to populate. Until then the array will be empty and
the dashboard renders an empty-state.
```

---

## Task 5: `<AffiliateCard />` dashboard widget

**Files:** Create `src/components/Dashboard/AffiliateCard.tsx`.

```tsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink } from '@fortawesome/free-solid-svg-icons';

interface AffiliateRow {
  domain: string;
  clicks: number;
}

interface Props {
  data?: AffiliateRow[];
}

export default function AffiliateCard({ data = [] }: Props) {
  const top = data.slice(0, 5);
  const totalClicks = data.reduce((s, r) => s + r.clicks, 0);

  return (
    <div className="affiliate-card">
      <header className="affiliate-card__header">
        <FontAwesomeIcon icon={faLink} className="affiliate-card__icon" />
        <div>
          <h3 className="affiliate-card__title">Affiliate clicks</h3>
          <p className="affiliate-card__subtitle">
            {totalClicks > 0
              ? `${totalClicks} total in this range`
              : 'No clicks tracked yet'}
          </p>
        </div>
      </header>
      {top.length === 0 ? (
        <p className="affiliate-card__empty">
          Add affiliate domains to <code>src/config/affiliates.ts</code> and
          register <code>link_domain</code> as a GA4 Custom Dimension.
        </p>
      ) : (
        <ol className="affiliate-card__list">
          {top.map((row) => (
            <li key={row.domain} className="affiliate-card__row">
              <span className="affiliate-card__domain">{row.domain}</span>
              <span className="affiliate-card__count">{row.clicks}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
```

Plus `AffiliateCard.css` (sibling) styled in the same family as MetricCard / NewsletterCard.

**Commit message:** `feat(analytics): add AffiliateCard dashboard widget`

---

## Task 6: Wire `<AffiliateCard />` into Dashboard + extend type

**Files:** Modify `src/components/Dashboard/Dashboard.tsx` and the analytics data type used by `useAnalyticsData`.

- Add `affiliateClicks?: { domain: string; clicks: number }[]` to whatever interface the hook returns.
- Render `<AffiliateCard data={data.affiliateClicks} />` near the existing tables row (e.g. as a third column in `tables-grid`, or as a new row).

**Commit message:** `feat(analytics): show AffiliateCard in /dashboard`

---

## Task 7: Deploy + smoke test

```bash
cd analytics-backend && vercel --prod
cd .. && npm run deploy
```

Smoke test: open the dashboard. The AffiliateCard should appear with the empty state ("No clicks tracked yet") since (a) the test environment hasn't received affiliate_click events yet, or (b) the GA4 Custom Dimension isn't registered. **Both are expected.** Manually click an Amazon link from the deployed site (e.g. inside a post body or repo card description), wait ~30 seconds, refresh the dashboard. Click should appear.

If `link_domain` Custom Dimension is registered, it'll show up by domain. If not, GA4 returns no rows and the widget keeps the empty state.

---

## Done criteria

- [ ] Tracker installed at boot, no console noise
- [ ] Clicks on Amazon links emit `affiliate_click` GA4 event (verifiable in GA4 Realtime → Events)
- [ ] Backend response includes `affiliateClicks` array (verifiable via curl)
- [ ] Dashboard renders the AffiliateCard with either real data or the empty state
- [ ] Each task is its own atomic commit. No `Co-Authored-By` trailer.
