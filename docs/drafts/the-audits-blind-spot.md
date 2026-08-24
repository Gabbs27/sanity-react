I published a post called "I Audited My Own Portfolio and Found 20 Problems." It
was an inventory: I went through my own site — a React 19 + Vite SPA with Sanity
as the CMS — wrote down everything that was wrong with it, fixed what mattered, and put the before and after numbers next to each item. If you haven't read it, the
only part that matters here is the methodology, and one line of it in particular:

> I went through the build output chunk by chunk in `build/assets/`.

I called that the step that hurts and the one most people skip. I still think
that is true. It is also the step that guaranteed I would miss the largest thing
wrong with the site.

## The step that worked

Weighing the build output worked exactly as advertised. Finding 1 of that audit
was an unoptimized PNG of a developer illustration on `/gabriel-abreu`, my contact page, 993 KB, sent
to every visitor who landed there. It went to 23 KB. A second image, the cutout
of me that sits in three different greetings, went from 358 KB to 45 KB.

Those two are bundled assets. A component imports one:

```tsx
import p from "../assets/developer-illustration.webp";
```

Vite follows that import, hashes the file, and emits it into `build/assets/`.
After the build it is a file on disk with a size. Listing the directory finds it.
Sorting the listing by size finds it first. There is no way to ship it and not
have it show up in that step.

So the method was sound within its domain: both of those images are bundled assets, and the step found both.

On August 23 I opened the blog index in a browser and watched what it actually
requested. Sixteen post covers, 9.88 MB.

None of that could have appeared in the audit. Not because I was sloppy that day
— because of where those bytes come from.

## Two lifecycles

A bundled asset exists at build time. An import makes it a build input, the
bundler makes it a build output, and anything that reads the build output sees
it.

A CMS image is never a build input. Nothing imports it. It arrives as a string in
a query result, after the page has already loaded. This is the query that feeds
the blog index:

```groq
*[_type == "post"] | order(publishedAt desc){
  title,
  slug,
  mainImage{ asset->{ _id, url } },
  publishedAt
}
```

That runs in a `useEffect` after mount. The `url` that comes back points at
`cdn.sanity.io`, React puts it in an `img src`, and the browser fetches it from a
CDN I do not build. At no point in the lifecycle of that image does a file land
in `build/assets/`.

Two different lifecycles, and my audit's most rigorous step could only observe
one of them. Not "did not happen to observe." Could not, by construction. The
scale was accurate. It was not weighing the whole load.

## What was actually on the page

Once I measured with a browser's real Accept header instead of a directory
listing:

```
/allpost, 16 post covers ........ 9.88 MB
one post page, 4 images ......... 4.54 MB
worst single image .............. 3.13 MB  (2160x2700 PNG, rendered ~250px wide)
another cover ................... 2.27 MB  (rendered at 433x227)
```

The two images the audit caught came to 1,351 KB between them. One route was
serving 9.88 MB.

Every one of my dev.to cross-posts closes with a link to `/allpost`. The heaviest route I measured was the page I send people to.

## `urlFor` was called once

Sanity ships an image-URL builder, `urlFor`, that applies CDN transformations —
width, fit, format. Before the fix, `urlFor` was called exactly once in the application. Not once per component. Once. It was in `OnePost.tsx`, inside the
PortableText serializer for images embedded in the body of an article:

```tsx
const src = value?.asset
  ? urlFor(value).width(1600).fit("max").auto("format").url()
  : value?.url;
```

Width capped, `fit: max` so nothing upscales, `auto: format` so modern browsers
get WebP. That is the correct call. It applies to images an author dropped into
the middle of a paragraph — the images a reader is least likely to notice.

`AllPosts.tsx` contained zero references to it. So did the post header. Those
cards rendered `mainImage.asset.url` — the original upload, straight from the
CDN — and let CSS scale it into a 250px box. The browser downloads all 3.13 MB first
and then paints it small.

It made the site look like a site that sized its images.

## The fix

The queries feeding those cards project `asset->{url}`, not the reference object
`urlFor` wants, so going through the builder meant rewriting the queries. Instead
the helper takes the URL the query already returns:

```ts
export function sizedImage(url: string | undefined | null, width: number): string {
  if (!url) return "";
  // Non-Sanity URLs (the BlockNote editor stores upload-endpoint URLs directly)
  // do not understand these parameters.
  if (!url.includes("cdn.sanity.io")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}w=${width}&fit=max&auto=format&q=75`;
}
```

`auto=format` negotiates on the request's Accept header, so a modern browser gets
WebP and an older one gets the original format. `fit=max` only ever scales down,
so a small source is never blown up. The `cdn.sanity.io` check is there because
my BlockNote editor stores upload-endpoint URLs directly and those do not
understand the parameters — appending them would have broken images that were
working.

Measured the same way afterward, those sixteen covers came to 182 KB, 56 times
less than before. The 2160x2700 PNG is 24 KB.

That is the number for those images on those routes, measured with one browser on one day. I have not measured load time on a real connection, and I am not
going to tell you the site is fast now.

## The scope is the claim I did not audit

An audit answers the question you point it at. Mine asked: what is heavy in what
I ship? The answer was correct.

But "what I ship" is a boundary drawn by the bundler, and the browser does not
know that boundary exists. It requests what the page tells it to request, from
wherever. My method treated a build artifact as a stand-in for a page load, and
those two things overlap on a site like this without being the same set.

What made that step feel rigorous is the same thing that made it narrow: it was
mechanical. A directory, a list of files, sizes, sorted. A measurement that can
be exhaustive is exhaustive over its own domain and silent about everything else,
and it does not feel silent — it feels finished. Twenty findings, all real, and 9.88 MB still going out on the route I advertise.

The list of findings is the part of an audit that gets checked. The scope is a
claim too — a claim about where problems are allowed to be — and it is the one
that ships unexamined. Next time I will write that claim down next to the
method, in the same document: here is what I measured, and here is what this
measurement cannot see.
