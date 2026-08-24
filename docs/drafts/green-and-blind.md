I wrote a commit message that says `SEO.tsx` "sets documentElement.lang" and "emits hreflang links". I opened a Spanish post in the browser, looked at the document, and there it was: `documentElement.lang === "es"`, and three `<link rel="alternate" hreflang>` tags for `es`, `en`, and `x-default`. Right language, right pairs, right default.

The commit message was accurate. The site was also serving `<html lang="en">` on every Spanish post, with zero hreflang annotations.

Both of those sentences are true. They are true of different surfaces.

## The annotation that was there and wasn't

This site is a React 19 SPA on Vercel with a build-time prerender step. The prerender writes the `<head>` into the static HTML so that crawlers get titles and meta tags without executing anything. `SEO.tsx` is a React component. It runs in the browser, after React mounts, and it does exactly what its commit message claims.

`scripts/prerender.mjs` writes the HTML the server actually sends. At that commit:

```
$ git show 86569b0:scripts/prerender.mjs | grep -c hreflang
0
```

The prerender rewrote only the `<head>` element. It never touched the `<html>` tag at all, so the `lang` attribute stayed at whatever `index.html` had baked in, which was `en`. And it emitted no alternates, because nothing in it knew the translation table existed.

I confirmed it with `curl` on all four paired URLs — English original and Spanish translation, both directions. Then I tried again with a Googlebot user-agent, in case Vercel was doing something clever for crawlers. Byte-identical response. There was no second delivery path. The sitemap had no `xhtml:link` alternates either.

There is a trap in this one worth naming, because it is what lets the mistake survive for a while. Every page on the site serves this:

```html
<link rel="alternate" type="application/rss+xml" ...>
```

Grep the served HTML for `alternate` and you find a hit. If you are checking quickly, and you are already fairly sure the feature works because you watched it work, a hit is enough. The string you searched for was present. It was the feed.

The practical consequence is narrower than it sounds. Google renders JavaScript, so for Google this was a delay rather than a loss. The exposure was to engines that do not render, which saw Spanish posts declared as English with no indication that a translation existed.

Fixed on 21 August. `prerender.mjs` now sets `lang` on the `<html>` element and emits the alternates, reading `src/config/translations.json` — the same file `src/config/translations.ts` reads. The table lives in JSON because a `.mjs` build script cannot import a `.ts` module, and keeping two copies of it is precisely how the two halves would drift apart again.

Verified after: `lang="es"` on the two Spanish posts, `lang="en"` on the two English ones, three hreflang links on each of the four paired posts, and zero on an unpaired post like `/tailwind-css` — which is the correct number, since an hreflang pointing at a translation that doesn't exist is a false claim.

I did not verify the wrong thing here. I verified a real thing on the surface that was easier to reach.

## The slot no test was watching

The second one isn't about checking the wrong surface. There was no surface to check.

Every post carries two ad units: one in-article, one at the foot of the post. On 20 August at 22:48 I shipped this line:

```js
setStatus(ins.getAttribute('data-ad-status') ?? 'no-response');
```

Three seconds after mount, if AdSense had not written a verdict onto the element, the code invented one. The CSS collapsed the container on `no-response`, so the slot went `display: none` — while AdSense was still measuring it. An ad cannot be placed into a hidden, zero-width box. The guess made itself come true.

That was live for about ten hours. The fix, at 08:46 the next morning, removed the timeout entirely: only AdSense's own verdict changes the state, and a missing verdict means "pending", which reserves space instead of collapsing it.

That installed the exact mirror of the bug it fixed.

In production, the end-of-post unit reaches `data-adsbygoogle-status="done"` and then never receives `data-ad-status` at all. Under the new rule, "never" is indistinguishable from "not yet". It sat in `pending` permanently. Measured in a real browser on 23 August, on /portfolio-audit-20-problems, both slots at the same moment:

```
slot 9344511662  (end of post)
  data-adsbygoogle-status   "done"
  data-ad-status            null
  iframes                   0
  height                    303px
  display                   block
  "Advertisement" label     visible

slot 2970675007  (in-article)
  data-adsbygoogle-status   "done"
  data-ad-status            "unfilled"
  height                    0px
  display                   none
```

Same page, same load. The asymmetry was in my state machine, not in AdSense.

So for two and a half days, every post on this site ended with an empty rectangle labeled "Advertisement" — 303 pixels tall on the page I measured. Nothing was red. No test failed. The build passed, the page rendered. 

The real fix: the grace period now starts only once AdSense itself reports `done`, and the observer stays attached afterward so a late verdict still wins. It also reads the attribute once immediately on attach, because a `MutationObserver` tells you nothing about what happened before you called `observe()`. Verified after: both slots 0px, `display: none`.

## Green because nothing is asking

The two failures are not the same shape.

In the hreflang case there was a check and it was watching the browser DOM instead of the response body. Wrong surface, honest mistake, findable.

In the ad case there was no check. Not a weak one — none. And from outside, "no check" and "check passed" produce the identical signal: a build that goes green. Absence of a failing test looks exactly like presence of a passing one when all you can see is the color. A missing assertion doesn't announce itself the way a broken one does.

That is why the empty box lasted two and a half days and the hreflang bug lasted until I happened to run `curl`.

## The thread this came from

I'm writing this because of a comment. On the dev.to cross-post of "How I Actually Code with Claude Code", Heinrich Neb put it better than I can: a check can be green and blind. His example was a test asserting that a benchmark number appeared in his server's output — where the number was a hardcoded string. The check guarded the sentence, not the measurement. It stayed green for weeks. Debashish Ghosal, in the same thread, suggested writing an outcome note onto each plan file after execution, which is a different attack on the same problem: make the record say what happened, not what was intended.

I don't have a general solution. I'm not going to end this with a testing philosophy, because I'd be inventing one on the spot to make the post feel finished.

What I actually have is a habit: open a browser, find the specific element, and measure it. Not the framework's idea of the element — the element. `curl` the URL instead of trusting the component that writes the tag. Read the height off the box instead of trusting the state that decides the height.

That is how both of these turned up: one at a time, by hand, because I happened to look. It would not have found a third.
