# Slice 5 — Newsletter (ConvertKit / Kit)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Capture email subscribers from the public site (blog list footer + end of each post) into ConvertKit, and surface aggregate counts (total + weekly delta) on the admin dashboard.

**Architecture:**
- Backend (Vercel Functions): two new endpoints. `POST /api/newsletter/subscribe` is **public** (no auth) — anyone visiting the blog can submit an email. `GET /api/newsletter/stats` is **admin-gated** — used by the dashboard widget.
- Frontend: a reusable `<NewsletterSignup />` component embedded at the end of `/allpost` and at the end of each `OnePost`. A `<NewsletterCard />` widget added to the existing dashboard alongside the GA4 metrics.
- ConvertKit's v3 REST API is used directly via native `fetch` — no SDK dependency.

**Tech stack:** No new runtime deps. Backend uses native fetch. Frontend uses controlled state + `useState`.

**Required env vars (in Vercel, both `production` and `preview`):**
- `CONVERTKIT_API_KEY` — from Settings → Advanced → API Key (v3 key, **not** the secret).
- `CONVERTKIT_FORM_ID` — numeric id of a Form created in the ConvertKit dashboard.

**Branch context:** Continue on `developer`. Working tree clean before starting.

---

## Verification policy

- After backend tasks: hit the deployed Vercel endpoint with `curl` (subscribe with a fake email and stats with the admin token); confirm 200 + expected shape.
- After frontend tasks: navigate to `/allpost` and `/<some-slug>` in dev preview; confirm the form renders, validates empty/bad email, shows success after submission.
- After dashboard widget: navigate to `/dashboard`, confirm the widget shows a number (or 0 + helpful empty state if no subs yet).
- Each task ends with one atomic commit. No `Co-Authored-By` trailer.

---

## Task 1: Create `api/newsletter/subscribe.js`

**Files:**
- Create: `analytics-backend/api/newsletter/subscribe.js`

### Step 1.1: Handler

```js
const { applyCors } = require('../_utils/ga4');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (!applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, firstName } = req.body || {};
  if (!email || !EMAIL_RE.test(String(email))) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const apiKey = process.env.CONVERTKIT_API_KEY;
  const formId = process.env.CONVERTKIT_FORM_ID;
  if (!apiKey || !formId) {
    console.error('ConvertKit env vars missing');
    return res.status(500).json({ error: 'Newsletter service not configured' });
  }

  try {
    const ckRes = await fetch(
      `https://api.convertkit.com/v3/forms/${formId}/subscribe`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          email,
          ...(firstName ? { first_name: firstName } : {}),
        }),
      }
    );
    const data = await ckRes.json();
    if (!ckRes.ok) {
      console.error('ConvertKit subscribe error:', data);
      return res.status(502).json({ error: 'Newsletter provider error' });
    }
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('subscribe handler error:', err);
    return res.status(500).json({ error: 'Failed to subscribe', message: err.message });
  }
};
```

### Step 1.2: Commit

```bash
git add analytics-backend/api/newsletter/subscribe.js
git commit -m "feat(newsletter): add public /api/newsletter/subscribe endpoint

POST forwards email (and optional firstName) to the configured
ConvertKit form via v3 REST API. Validates email shape server-side
before forwarding so spammy POSTs don't burn ConvertKit quota."
```

---

## Task 2: Create `api/newsletter/stats.js`

**Files:**
- Create: `analytics-backend/api/newsletter/stats.js`

### Step 2.1: Handler

ConvertKit's v3 has `/v3/subscribers` which returns paginated subscribers with totals. We use the response's `total_subscribers` for the count, and a date-filtered query for the weekly delta.

```js
const { requireAdmin } = require('../_utils/auth');
const { applyCors } = require('../_utils/ga4');

module.exports = async (req, res) => {
  if (!applyCors(req, res)) return;
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CONVERTKIT_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Newsletter service not configured' });
  }

  try {
    // Total subscribers — fetch the first page just to read pagination total.
    const totalRes = await fetch(
      `https://api.convertkit.com/v3/subscribers?api_secret=${apiKey}&per_page=1`
    );
    const totalData = await totalRes.json();
    const total = totalData.total_subscribers ?? 0;

    // Subscribers from the last 7 days.
    const sinceISO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weekRes = await fetch(
      `https://api.convertkit.com/v3/subscribers?api_secret=${apiKey}&from=${encodeURIComponent(sinceISO)}&per_page=1`
    );
    const weekData = await weekRes.json();
    const weeklyDelta = weekData.total_subscribers ?? 0;

    return res.json({ total, weeklyDelta });
  } catch (err) {
    console.error('stats handler error:', err);
    return res.status(500).json({ error: 'Failed to fetch stats', message: err.message });
  }
};
```

**Note:** ConvertKit's `/v3/subscribers` endpoint accepts `api_secret` (not `api_key`) for read access. If the user only has the API key (not secret), this stats endpoint will fail with auth error — we return 0 + log, dashboard widget should handle gracefully.

### Step 2.2: Commit

```bash
git add analytics-backend/api/newsletter/stats.js
git commit -m "feat(newsletter): add admin /api/newsletter/stats endpoint

GET returns total subscribers + last-7-days delta via two
ConvertKit /v3/subscribers calls (one unscoped for total, one
scoped via 'from' query for the recent window). Requires
ADMIN_TOKEN."
```

---

## Task 3: Frontend `<NewsletterSignup />` component

**Files:**
- Create: `src/components/Newsletter/NewsletterSignup.tsx`
- Create: `src/components/Newsletter/NewsletterSignup.css`

### Step 3.1: Component

```tsx
import { useState, type FormEvent } from 'react';
import './NewsletterSignup.css';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface Props {
  variant?: 'inline' | 'card';
  title?: string;
  description?: string;
}

const apiUrl = import.meta.env.VITE_ANALYTICS_API_URL || '';

export default function NewsletterSignup({
  variant = 'card',
  title = 'Suscríbete al newsletter',
  description = 'Tutoriales, recursos y reflexiones sobre desarrollo. Sin spam — cancelas cuando quieras.',
}: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg(null);
    try {
      const res = await fetch(`${apiUrl}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setStatus('success');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (status === 'success') {
    return (
      <div className={`newsletter newsletter--${variant} newsletter--success`}>
        <p className="newsletter__success">
          ✓ ¡Casi listo! Revisa tu inbox para confirmar la suscripción.
        </p>
      </div>
    );
  }

  return (
    <section className={`newsletter newsletter--${variant}`} aria-labelledby="newsletter-title">
      <h3 id="newsletter-title" className="newsletter__title">{title}</h3>
      <p className="newsletter__description">{description}</p>
      <form onSubmit={handleSubmit} className="newsletter__form" noValidate>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          aria-label="Email"
          className="newsletter__input"
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email}
          className="newsletter__btn">
          {status === 'loading' ? 'Suscribiendo…' : 'Suscribirme'}
        </button>
      </form>
      {status === 'error' && (
        <p className="newsletter__error" role="alert">
          {errorMsg || 'Algo falló. Intenta de nuevo en un momento.'}
        </p>
      )}
    </section>
  );
}
```

### Step 3.2: CSS

```css
.newsletter {
  margin: 2rem 0;
}

.newsletter--card {
  background: var(--card-bg);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
}

.newsletter--inline {
  background: linear-gradient(135deg, rgba(217, 119, 87, 0.06), rgba(87, 185, 217, 0.06));
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.newsletter__title {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: var(--color-text-primary);
}

.newsletter__description {
  margin: 0 0 1.25rem;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
}

.newsletter__form {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.newsletter__input {
  flex: 1 1 240px;
  min-width: 0;
  padding: 0.7rem 1rem;
  font-size: 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--input-bg);
  color: var(--color-text-primary);
}

.newsletter__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.newsletter__btn {
  flex: 0 0 auto;
  padding: 0.7rem 1.4rem;
  font-weight: 600;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.2s ease;
}

.newsletter__btn:hover:not(:disabled) {
  background: var(--color-primary-hover, #4F46E5);
  transform: translateY(-1px);
}

.newsletter__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.newsletter__error {
  margin: 0.75rem 0 0;
  color: #dc2626;
  font-size: 0.85rem;
}

.newsletter__success {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #16a34a;
}
```

### Step 3.3: Commit

```bash
git add src/components/Newsletter/NewsletterSignup.tsx src/components/Newsletter/NewsletterSignup.css
git commit -m "feat(newsletter): add reusable NewsletterSignup form component

Controlled email input with idle/loading/success/error states. Posts to
the public /api/newsletter/subscribe endpoint (no auth). Two visual
variants: 'card' (full padded box for /allpost footer) and 'inline'
(softer gradient strip for end-of-post placement)."
```

---

## Task 4: Embed `<NewsletterSignup />` in `/allpost` + `OnePost`

**Files:**
- Modify: `src/components/AllPosts.tsx` — render `<NewsletterSignup variant="card" />` after the post grid
- Modify: `src/components/OnePost.tsx` — render `<NewsletterSignup variant="inline" />` after the body

### Step 4.1: AllPosts edit

Just import + render after the grid (and before pagination, or at the very end — pick whichever flows better).

### Step 4.2: OnePost edit

Import + render at the bottom of the `<article>` after the `.post-content` div.

### Step 4.3: Commit

```bash
git add src/components/AllPosts.tsx src/components/OnePost.tsx
git commit -m "feat(newsletter): embed signup form on /allpost and end of each post"
```

---

## Task 5: Dashboard `<NewsletterCard />` widget

**Files:**
- Create: `src/components/Dashboard/NewsletterCard.tsx`
- Modify: `src/components/Dashboard/Dashboard.tsx` — render the widget alongside the metric cards

### Step 5.1: Card component

Modeled after the existing `MetricCard.tsx` so visual style matches.

```tsx
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';

interface Stats {
  total: number;
  weeklyDelta: number;
}

export default function NewsletterCard() {
  const { adminToken } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminToken) return;
    const apiUrl = import.meta.env.VITE_ANALYTICS_API_URL || '';
    fetch(`${apiUrl}/api/newsletter/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)))
      .then(setStats)
      .catch((e) => setError(String(e)));
  }, [adminToken]);

  return (
    <div className="metric-card metric-card--newsletter">
      <div className="metric-card__icon">
        <FontAwesomeIcon icon={faEnvelope} />
      </div>
      <div className="metric-card__body">
        <div className="metric-card__label">Newsletter</div>
        {error ? (
          <div className="metric-card__value metric-card__value--small">N/A</div>
        ) : stats ? (
          <>
            <div className="metric-card__value">{stats.total.toLocaleString()}</div>
            <div className="metric-card__sublabel">
              {stats.weeklyDelta > 0 ? `+${stats.weeklyDelta} esta semana` : 'Sin nuevos esta semana'}
            </div>
          </>
        ) : (
          <div className="metric-card__value metric-card__value--small">…</div>
        )}
      </div>
    </div>
  );
}
```

### Step 5.2: Wire into Dashboard

Find the row of `<MetricCard>` usages in `Dashboard.tsx` and add `<NewsletterCard />` as the next item in that grid.

### Step 5.3: Commit

```bash
git add src/components/Dashboard/NewsletterCard.tsx src/components/Dashboard/Dashboard.tsx
git commit -m "feat(newsletter): add NewsletterCard widget to /dashboard

Mirrors the visual language of MetricCard. Fetches /api/newsletter/stats
on mount and shows total subscribers + 'this week' delta. Falls back
to 'N/A' if the API errors (e.g. ConvertKit not configured yet)."
```

---

## Task 6: Deploy + smoke test

### Step 6.1: Deploy backend

```bash
cd analytics-backend
vercel --prod
```

### Step 6.2: Deploy frontend

```bash
cd ..
npm run deploy
```

### Step 6.3: Smoke tests

Subscribe (public, no auth):
```bash
curl -X POST https://analytics-backend-seven.vercel.app/api/newsletter/subscribe \
  -H 'Content-Type: application/json' \
  -d '{"email":"test+slice5@example.com"}'
```
Expect 201. Verify in ConvertKit dashboard that the test email shows up under the form.

Stats (admin only):
```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://analytics-backend-seven.vercel.app/api/newsletter/stats
```
Expect `{total: N, weeklyDelta: M}`.

Visual:
- Open `/allpost` → form visible at the bottom.
- Open any post → inline form visible at end.
- Open `/dashboard` → newsletter card visible alongside metrics.

---

## Done criteria

- [ ] Backend has 2 new endpoints, both reachable in production
- [ ] Frontend has signup form embedded in 2 places (allpost + each post)
- [ ] Dashboard shows the newsletter widget
- [ ] Subscribe flow lands a real email in ConvertKit (verified manually in CK dashboard)
- [ ] Each task is its own atomic commit; no `Co-Authored-By` trailer

---

## Skills referenced

- @superpowers:executing-plans
- @superpowers:verification-before-completion
- @superpowers:systematic-debugging (if API integration surprises us)
