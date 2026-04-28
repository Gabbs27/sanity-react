# Slice 1 — Theme Audit Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve the 6 remaining dark/light-mode contrast bugs identified by the theme audit so that no text is invisible and no card is off-theme in either mode.

**Architecture:** Each fix is a small CSS edit that either (a) replaces a hardcoded color with a CSS custom property defined by the theme, or (b) adds a `[data-theme="..."]` override for the missing variant. No JS or markup changes. Verification is visual (`preview_screenshot`) plus computed-style assertion (`preview_inspect`).

**Tech Stack:** CSS only. Theme variables defined in `src/styles/theme.css`. Dev preview running on `localhost:3000`.

**Audit reference:** Theme audit completed 2026-04-27. Two findings already fixed earlier in the session (`.cta-container` text and `.post-card__read-more:hover`). Six remaining are tasked below.

**Branch context:** Working directory currently has uncommitted work from earlier in the session (Footer redesign, RepoCard, CTA fix, PostCard read-more fix). Task 0 lands those as logically grouped commits before starting the audit fixes, so each commit is reviewable.

---

## Verification policy

For every CSS task:
1. Apply the fix.
2. Use `preview_inspect` to confirm the computed `color`, `background`, or `background-color` matches the expected theme variable in **both** dark mode (default) and light mode (`document.documentElement.setAttribute('data-theme','light')`).
3. Take a `preview_screenshot` of the affected component in both modes.
4. Confirm visually that no text is invisible and no card is off-theme.
5. Commit only after verification passes.

If any verification step fails: stop, root-cause via specificity inspection, fix, re-verify.

---

## Task 0: Commit pre-existing session work

Before starting the audit fixes, land the work already completed in this session as three focused commits.

**Files (already modified, uncommitted):**
- `src/components/Footer.tsx`
- `src/components/Repos.tsx`
- `src/components/card/PostCard.css`
- `src/index.css`
- `src/components/card/RepoCard.tsx` (new)
- `src/components/card/RepoCard.css` (new)

### Step 0.1: Commit footer redesign + CTA contrast fix

Files in this commit:
- `src/components/Footer.tsx` (unified icon color, removed individual color classes)
- `src/index.css` — only the `.footer--t`, `.footer--text`, `.footer--buttons`, `.footer-social-link` blocks AND the `.cta-container/.cta-title/.cta-description` blocks

```bash
git add src/components/Footer.tsx
# index.css contains both footer changes AND CTA fix — both belong in this commit
git add src/index.css
git commit -m "fix(ui): redesign footer + force CTA title contrast in light mode

Footer: unify all social icons to a single complementary cyan (#57b9d9),
center copyright with flex layout, and add hover lift transition.

CTA: increase selector specificity on .cta-title and .cta-description so
the global h1-h6/p theme rules in theme.css can no longer override the
white-on-gradient color. Previously in light mode the heading rendered as
near-black text on a navy gradient, illegible."
```

### Step 0.2: Commit Repos card redesign

```bash
git add src/components/card/RepoCard.tsx src/components/card/RepoCard.css src/components/Repos.tsx
git commit -m "feat(repos): replace generic Card with GitHub-aware RepoCard

The previous repo grid reused the project Card component with a Git diamond
placeholder image, producing visually identical bland tiles. New RepoCard
shows repo metadata pulled from the GitHub API: language with a colored dot
matching GitHub conventions, stars, forks, relative updated time, and topics
when present. Hover state adds a subtle lift, accent border, and gradient
side-bar. Light/dark theme variants included."
```

### Step 0.3: Commit PostCard read-more dark-mode fix

```bash
git add src/components/card/PostCard.css
git commit -m "fix(theme): make 'Read Article' overlay legible in dark mode

The hover state set color to var(--color-secondary), which in dark mode
is #F1F5F9 (near-white) — combined with the white background the text
became invisible. Replace the variable with a fixed dark color since the
background is always white on hover regardless of theme."
```

### Step 0.4: Verify clean working tree

Run: `git status --short`
Expected: only `.claude/` shown as untracked (settings, leave alone).

---

## Task 1: Fix `.error-boundary-content` (common.css)

**Bug:** Fixed `background: white` with hardcoded text colors. In dark mode the box stays white in a dark theme — looks broken.

**Files:**
- Modify: `src/components/common/common.css:14` (and following lines defining `.error-boundary-content` text colors)

### Step 1.1: Inspect current style in dark mode

Trigger the error boundary in the preview by visiting an invalid route or temporarily throwing in a component, OR just inspect the rule directly via Bash:

```bash
sed -n '10,40p' src/components/common/common.css
```

Confirm `.error-boundary-content` uses `background: white` and any hardcoded `color: #...` text values.

### Step 1.2: Apply the fix

Replace the hardcoded values with theme variables. Use the Edit tool:

```css
.error-boundary-content {
  background: var(--card-bg, #ffffff);
  color: var(--color-text-primary, #0F172A);
  /* preserve other layout properties unchanged */
}
```

If there are nested selectors (`.error-boundary-content h1`, `.error-boundary-content p`) that hardcoded text colors, change them to:
- Headings: `color: var(--color-text-primary)`
- Paragraphs: `color: var(--color-text-secondary)`

### Step 1.3: Verify computed style

Add a temporary error trigger in the preview, OR inspect the rule directly. With the dev server running, in `preview_eval`:

```js
// Manually create the element to inspect computed styles
const el = document.createElement('div');
el.className = 'error-boundary-content';
document.body.appendChild(el);
const dark = getComputedStyle(el).backgroundColor;
document.documentElement.setAttribute('data-theme','light');
const light = getComputedStyle(el).backgroundColor;
document.documentElement.removeAttribute('data-theme');
el.remove();
({dark, light})
```

Expected: dark mode bg is the dark card color from theme; light mode bg is white. They are different values.

### Step 1.4: Commit

```bash
git add src/components/common/common.css
git commit -m "fix(theme): use theme variables for error-boundary-content background"
```

---

## Task 2: Fix `.error-button` and `.error-details summary` (common.css)

**Bug:** `.error-details summary` has `color: #6366F1` (indigo) over a navy gradient → invisible in dark mode. `.error-button` is OK (white on indigo) but related rules are inconsistent.

**Files:**
- Modify: `src/components/common/common.css` lines around 42-69 (the `.error-button` and `.error-details summary` rules)

### Step 2.1: Read current state

```bash
sed -n '40,75p' src/components/common/common.css
```

### Step 2.2: Apply the fix

For `.error-details summary`, replace `color: #6366F1` with `color: var(--color-primary)` so it uses theme-aware indigo. In dark mode `--color-primary` is `#818CF8` (lighter indigo), giving better contrast on the navy gradient.

For `.error-button`: leave `color: white` — it sits on a known-dark gradient (`#6366F1 → #0F172A`) and white is correct in both themes. Change `background-color` only if currently hardcoded; keep gradient if intentional.

### Step 2.3: Verify

Same `preview_eval` pattern as Task 1.3 but inspect the `summary` element:

```js
const el = document.createElement('summary');
el.className = 'error-details';
// Place inside a parent with the correct context if needed.
```

OR rely on visual confirmation by triggering an error.

### Step 2.4: Commit

```bash
git add src/components/common/common.css
git commit -m "fix(theme): make error-details summary text use --color-primary for legibility"
```

---

## Task 3: Add dark-mode variant for `.project-card` (Card.css)

**Bug:** `.project-card` has `background: white` with no `[data-theme="dark"]` override → cards stay white in dark theme.

**Files:**
- Modify: `src/components/card/Card.css`

### Step 3.1: Read current state

```bash
grep -n "project-card\|card-content" src/components/card/Card.css | head -20
sed -n '1,80p' src/components/card/Card.css
```

### Step 3.2: Apply the fix

Append the following at the end of `Card.css`:

```css
/* Dark-mode variant for project cards.
   Previously the .project-card rule used `background: white` unconditionally,
   leaving cards white in dark theme. */
:root .project-card {
  /* default dark theme: use theme's card-bg variable */
  background: var(--card-bg, #1e293b);
}

[data-theme="light"] .project-card {
  background: #ffffff;
}

[data-theme="light"] .project-card .card-title {
  color: #0F172A;
}

[data-theme="light"] .project-card .card-description {
  color: #475569;
}
```

If the existing `.project-card` rule starts at line 1 with `background: white`, replace that line with `background: var(--card-bg, #1e293b);` so the **default** is theme-aware, then keep the `[data-theme="light"]` override to force white in light mode.

### Step 3.3: Verify in both modes

In `preview_eval`:

```js
(async () => {
  const navigateToPortfolio = () => { window.location.hash = '#/'; };
  navigateToPortfolio();
  await new Promise(r => setTimeout(r, 1500));
  const el = document.querySelector('.project-card');
  if (!el) return 'no .project-card found on page';
  document.documentElement.removeAttribute('data-theme');
  const dark = getComputedStyle(el).backgroundColor;
  document.documentElement.setAttribute('data-theme','light');
  const light = getComputedStyle(el).backgroundColor;
  document.documentElement.removeAttribute('data-theme');
  return { dark, light };
})()
```

Expected: dark mode bg is something dark (e.g. `rgb(30, 41, 59)`); light mode bg is `rgb(255, 255, 255)`.

Take screenshot in each mode to confirm cards visually integrate with their respective backgrounds.

### Step 3.4: Commit

```bash
git add src/components/card/Card.css
git commit -m "fix(theme): add dark-mode variant for project-card

Previously project cards used a hardcoded white background which made
them stand out as bright rectangles in dark theme. Make the default
theme-aware via var(--card-bg) and keep an explicit [data-theme=light]
override that forces white in light mode."
```

---

## Task 4: Fix `.contact-link.resume` contrast (index.css)

**Bug:** `.contact-link.resume` uses `background-color: var(--color-accent)` (light cyan in dark mode) with hardcoded dark text — works in light mode but degrades in dark mode where accent gets lighter.

**Files:**
- Modify: `src/index.css` around line 340

### Step 4.1: Read current state

```bash
sed -n '335,355p' src/index.css
```

Identify the exact selector and current `background-color` and `color` declarations.

### Step 4.2: Apply the fix

Two viable approaches:

**Option A (preferred):** keep accent background, switch text color to a value that contrasts on accent in *both* themes. Since `--color-accent` is sky blue (`#38BDF8` dark, `#7DD3FC` light), dark text works in both — but the light variant has lower contrast. A safer choice:

```css
.contact-link.resume {
  background-color: var(--color-accent, #38BDF8);
  color: #0F172A; /* dark text — passes contrast on both #38BDF8 and #7DD3FC */
}
```

If the contrast on `#7DD3FC` is borderline, add a light-mode override forcing a deeper accent:

```css
[data-theme="light"] .contact-link.resume {
  background-color: #0EA5E9; /* sky-500, deeper than the lighter accent */
  color: #ffffff;
}
```

### Step 4.3: Verify with WCAG-ish ratio

In `preview_eval`:

```js
(() => {
  const el = document.querySelector('.contact-link.resume');
  if (!el) return 'not on this page';
  document.documentElement.removeAttribute('data-theme');
  const darkBg = getComputedStyle(el).backgroundColor;
  const darkColor = getComputedStyle(el).color;
  document.documentElement.setAttribute('data-theme','light');
  const lightBg = getComputedStyle(el).backgroundColor;
  const lightColor = getComputedStyle(el).color;
  document.documentElement.removeAttribute('data-theme');
  return { darkBg, darkColor, lightBg, lightColor };
})()
```

Expected: in light mode, either bg got darker OR color got lighter — i.e. there's a deliberate contrast adjustment, not just inheritance from dark mode.

### Step 4.4: Commit

```bash
git add src/index.css
git commit -m "fix(theme): improve contrast of .contact-link.resume in light mode"
```

---

## Task 5: Fix `.spinner-circle` and `.lazy-image-wrapper` (common.css)

**Bug:**
- `.spinner-circle` has hardcoded gray border that disappears on light backgrounds.
- `.lazy-image-wrapper` has `background: #f0f0f0` placeholder that's invisible on dark backgrounds.

**Files:**
- Modify: `src/components/common/common.css` around lines 102 and 118

### Step 5.1: Read current state

```bash
sed -n '95,130p' src/components/common/common.css
```

### Step 5.2: Apply both fixes in one pass

```css
/* Spinner: use theme border color */
.spinner-circle {
  border: 4px solid var(--color-border, #E2E8F0);
  border-top-color: var(--color-primary, #6366F1);
  /* preserve other properties: width, height, animation, etc. */
}

/* Lazy image wrapper: theme-aware placeholder */
.lazy-image-wrapper {
  background: var(--color-bg-tertiary, #f0f0f0);
}
```

Use Edit tool with surrounding context to keep specificity intact.

### Step 5.3: Verify

```js
(() => {
  const r = {};
  const sp = document.querySelector('.spinner-circle');
  const lw = document.querySelector('.lazy-image-wrapper');
  document.documentElement.removeAttribute('data-theme');
  r.darkSpinner = sp ? getComputedStyle(sp).borderTopColor : 'not visible';
  r.darkLazy = lw ? getComputedStyle(lw).backgroundColor : 'not visible';
  document.documentElement.setAttribute('data-theme','light');
  r.lightSpinner = sp ? getComputedStyle(sp).borderTopColor : 'not visible';
  r.lightLazy = lw ? getComputedStyle(lw).backgroundColor : 'not visible';
  document.documentElement.removeAttribute('data-theme');
  return r;
})()
```

Expected: each property changes between modes (or both modes are simultaneously visible; the absolute values must differ from "transparent" or matching-the-bg).

### Step 5.4: Commit

```bash
git add src/components/common/common.css
git commit -m "fix(theme): make spinner-circle and lazy-image-wrapper theme-aware"
```

---

## Task 6: Add light-mode variant for `.service-icon` (index.css)

**Bug:** `.service-icon` has a fixed indigo→sky gradient with white text. The white text is fine in both modes; the gradient's indigo (`#6366F1`) can clash on a fully-white light-mode backdrop.

**Files:**
- Modify: `src/index.css` around line 433

### Step 6.1: Read current state

```bash
sed -n '425,445p' src/index.css
```

### Step 6.2: Apply the fix

Add a light-mode override that uses softer colors better suited to a white page:

```css
[data-theme="light"] .service-icon {
  background: linear-gradient(135deg, #818CF8 0%, #7DD3FC 100%);
}
```

Keep the original dark-mode gradient untouched — it works on a dark page.

### Step 6.3: Verify

```js
(async () => {
  window.location.hash = '#/services';
  await new Promise(r => setTimeout(r, 1500));
  const el = document.querySelector('.service-icon');
  if (!el) return 'service-icon not in DOM';
  document.documentElement.removeAttribute('data-theme');
  const dark = getComputedStyle(el).backgroundImage;
  document.documentElement.setAttribute('data-theme','light');
  const light = getComputedStyle(el).backgroundImage;
  document.documentElement.removeAttribute('data-theme');
  return { dark, light };
})()
```

Expected: both modes return a `linear-gradient(...)` string and they differ from each other.

### Step 6.4: Commit

```bash
git add src/index.css
git commit -m "fix(theme): soften service-icon gradient in light mode"
```

---

## Task 7: Final verification pass

A holistic check that the slice as a whole is healthy.

### Step 7.1: Reload preview and snapshot dark mode

```js
(async () => {
  document.documentElement.removeAttribute('data-theme');
  location.reload();
})()
```

Then take screenshots of each affected page:
- `/` (home with services)
- `/allpost` (post cards + footer CTA if shown)
- `/repositorios` (repo cards)
- `/portfolio` or `/` again for project cards

### Step 7.2: Toggle to light mode and snapshot the same pages

```js
document.documentElement.setAttribute('data-theme','light');
```

Walk through the same 4 pages.

### Step 7.3: Console + network sanity

Use `preview_console_logs` (level: `error`, `warn`) and `preview_network` (filter: `failed`) to confirm no theme-fix introduced runtime errors.

Expected: no errors. The pre-existing analytics request failures (`google-analytics.com 204 ERR_ABORTED`) are noise from ad-blockers in the preview environment and unrelated to the slice.

### Step 7.4: Final review commit (only if anything tweaked)

If verification surfaced any small adjustment, apply it and commit as:

```bash
git commit -m "fix(theme): minor follow-ups from final verification pass"
```

If nothing needed adjusting, no commit — the slice is done.

### Step 7.5: Slice 1 retrospective note

Append to the design doc (`docs/plans/2026-04-27-admin-panel-monetization-design.md`) a one-line confirmation that Slice 1 is complete and the date. Optional but useful for tracking.

```bash
git add docs/plans/2026-04-27-admin-panel-monetization-design.md
git commit -m "docs: mark slice 1 (theme fixes) complete"
```

---

## Done criteria for Slice 1

- [ ] Task 0 commits cleanly land all session-pending work in 3 logical commits.
- [ ] All 6 audit-identified bugs (Tasks 1–6) are fixed and verified in both themes.
- [ ] `git status --short` shows only `.claude/` (or empty) at the end.
- [ ] No new console errors in dev preview.
- [ ] Dark and light mode each produce coherent visuals in: home, blog list, repo grid, project grid, services page.
- [ ] Each fix is in its own commit so a single revert is possible if regression appears.

---

## Skills referenced

- @superpowers:executing-plans — to drive task-by-task execution
- @superpowers:verification-before-completion — gates each commit on verification evidence
- @superpowers:systematic-debugging — if any verification step uncovers an unexpected behavior
