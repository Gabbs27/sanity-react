Auditing someone else's site is easy. You open devtools, point at what's broken, send the invoice, leave. Auditing your own is a different job, because every bad decision in it is yours, most of them made around eleven at night on a Tuesday, and you have spent months certain they were fine.

So I sat down with codewithgabo.com and reviewed it like it belonged to a client. No excuses, no "I'll get to that later." The review turned up **20 findings** across four areas. Five of them stung.

This post is the honest list: what I found, why it was there, and which number moved when I fixed it.

## How I audited

There's no trick to it. The method was boring on purpose, because boring is what actually finds things.

- I read **every public component** and every route definition in `src/`.
- I walked the **10 public routes** in a browser, at 375px and on desktop, writing down each page's `h1`, its character count, its internal links, and any broken image.
- I queried Sanity to count the posts and words I actually had, not the ones I assumed I had.
- I ran `npm audit` and `npm outdated`.
- I went through the build output chunk by chunk in `build/assets/`.

That last step is the one that hurts and the one most people skip. Looking at the real weight of what you ship is like stepping on a scale in January: you already know it's bad, but you need the number.

## Finding 1: a 993 KB illustration

The worst of the twenty. On `/gabriel-abreu` I was serving an unoptimized PNG of a developer illustration. **993 KB.** Almost a megabyte of decoration.

It had company. `nobggabo.png` weighed 358 KB and shipped on the home page, the blog index and the repos page, because all three variants of my `Greeting` component import it. So those 358 KB sat on the critical path of the three pages people land on first.

The fix has no technical merit whatsoever: convert to WebP at quality 80.

```text
developer-illustration:  993 KB  ->  23 KB   (-98%)
nobggabo:                358 KB  ->  45 KB   (-87%)
```

Ninety-eight percent. Nearly a megabyte, for a drawing that looks identical. The credit isn't in the conversion. It's in finally bothering to look.

**The lesson:** if you've never checked what your images weigh, that is your biggest problem right now. Statistically, it just is.

## Finding 2: the sitemap contained zero posts

I had 9 published posts. My `sitemap.xml` listed **7 static pages and no posts at all**. The `lastmod` dates were frozen months in the past on top of that.

Which means I'd been writing content and then not showing it to Google. All of the writing work, none of the distribution work.

The root cause was that the sitemap was a static file I had to update by hand. By hand means never.

It's now generated at build time from a GROQ query against Sanity, running as `prebuild`:

```groq
*[_type=="post" && !(_id in path("drafts.**")) && defined(slug.current)]{
  "slug": slug.current,
  _updatedAt
}
```

Every `npm run build` writes a fresh `sitemap.xml` with all the posts and real dates. It no longer depends on me remembering.

**The lesson:** anything that depends on your memory is already broken. You just haven't found out yet.

## Finding 3: my 404 page didn't exist in practice

This is the one I'm most embarrassed by, because it was a real bug and not an oversight.

If you typed `codewithgabo.com/anything`, the site hung forever on **"Loading post..."**. No 404. No error message. Just a spinner, until you got bored and closed the tab.

The cause: my post route, `/:slug`, caught any unknown URL before it could ever reach the `*` route that renders `NotFound`. `OnePost` queried Sanity, got nothing back, and since it didn't distinguish "still loading" from "this doesn't exist," it sat in the loading state indefinitely.

The fix was separating those two states:

```tsx
const [postData, setPostData] = useState<SanityPostData | null>(null);
const [notFound, setNotFound] = useState(false);

// ...

if (notFound) return <NotFound />;
if (!postData) return <LoadingSpinner message="Loading post..." />;
```

Three lines. One extra `useState` and two returns in the right order. That was the fix for a bug that had spent months quietly turning visitors away.

While I was in there I gave the 404 page an actual design: the big number, a bilingual heading, and three buttons that take you somewhere useful instead of leaving you stranded.

**The lesson:** a loading state that never resolves looks exactly like "slow." That's why nobody reports it.

## Finding 4: a feature that hadn't rendered in months

In `data.ts` I have three projects tagged `badge: "New"`: Analytics Dashboard, NegocioRD and A2C International. The `Card` component accepts a `badge` prop and renders it as a pill.

The pill never appeared. Not once.

Why? Because `Portfolio.tsx` destructured `image`, `title`, `description`, `url` and `languages` off each project, and forgot `badge`. The data existed. The component that renders it existed. Nobody had ever introduced the two to each other.

```diff
  description={project.description}
  url={project.url}
  languages={project.languages}
+ badge={project.badge}
```

**One line.** I wrote the data, I wrote the component, and I left out the wire between them. It sat like that for months, and I never noticed because I never looked at the project grid asking "does this look the way it should?" I looked at it asking "does it load?"

**The lesson:** check your UI against what it's *supposed* to show, not against what it shows. Those are different questions and only one of them catches this bug.

## Finding 5: 405 KB of charting library for people who hadn't asked for charts

I keep an analytics dashboard at `/dashboard-demo`, public, so the work is visible. It uses recharts.

Recharts is heavy. And it was sitting inside the chunk loaded eagerly when you hit the route. So anyone who opened the demo downloaded **405 KB** of charting library before deciding whether they even cared.

The fix was wrapping `ChartCard` in `React.lazy` with `Suspense`, so recharts becomes its own chunk and only comes down when the charts are actually about to mount:

```text
before:  useAnalyticsData chunk = 405 KB   (recharts inside)
after:   useAnalyticsData chunk =   3 KB
         ChartCard chunk        = 411 KB   (lazy)
```

405 KB down to 3 KB on initial load. The library still weighs what it weighs, obviously. What changed is *when* you pay for it, and who does.

**The lesson:** code splitting doesn't make your app smaller. It stops the people who bounce from paying for what they never used.

## The other fifteen

Not all of them were dramatic. Six unused images sitting in the repo, more than a megabyte of dead weight. One moderate vulnerability in a dependency. A page, `/education`, that existed and rendered content but wasn't linked from anywhere in the menu. Forgotten `console.log` and `console.warn` calls in five files. No privacy policy page and no terms page.

There were also things that were fine, which is worth writing down so you don't drive yourself crazy: the mobile layout was clean, the content density was good, and the ad configuration was correct. An honest audit also tells you what to leave alone.

## How to audit yours

If you're up for it, this is the order I'd go in. It's sorted by return per hour spent:

1. **Weigh your images.** Sort by size and look at the top three. If anything is over 200 KB, there's your afternoon.
2. **Type a URL that doesn't exist** on your own site. Watch what happens. Count to ten. If it's still loading, you have my finding number 3.
3. **Open your sitemap** and count the URLs. Is your actual content in there? Are the dates real?
4. **Look at your build chunk sizes.** Anything over 300 KB that isn't required for the first paint is a candidate for lazy loading.
5. **Walk every page asking what it should be showing**, not whether it loads. That's where bugs like the badge one turn up.
6. **Run `npm audit` and `npm outdated`.** Ten seconds.
7. **Grep the project for `console.log`.** Another ten seconds.

All seven steps fit in an afternoon. It took me one afternoon to find these and another to fix the ones that mattered.


## What I actually learned

None of these problems were hard. Not one. The most complex fix was three lines; the highest-impact one was converting a PNG to WebP, which is a single command.

They weren't there because they were difficult. They were there because **I never sat down and looked.** Building is more fun than reviewing, so you keep building on top, and the broken things stay underneath, holding up the building with a months-old bug.

If you have a portfolio, a blog or a side project you haven't honestly looked at in a while: put two hours on the calendar this week. Not to add anything. Just to look.

You'll find your own 993 KB PNG. I promise.
