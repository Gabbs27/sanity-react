---
title: Tailwind CSS
published: true
date: 2023-02-10 20:05:00 UTC
tags: css, tailwindcss, webdev, beginners
cover_image: https://cdn.sanity.io/images/nnt7ytcd/production/915392f6454e0d8235f6e62064722238633927a4-1080x1080.png?w=1000&h=420&fit=crop&auto=format&q=80
canonical_url: https://codewithgabo.com/tailwind-css
---

Having trouble with CSS? Try Tailwind.

Are you tired of writing countless lines of CSS to style your web pages, only to end up with messy, hard-to-maintain code? Or perhaps you're just starting out with web development and feeling overwhelmed by the complexity of CSS? If so, you might want to consider giving Tailwind CSS a try.

Tailwind is a utility-first CSS framework. Instead of giving you components like `.btn` or `.card`, it gives you hundreds of tiny single-purpose classes — `p-4`, `text-sm`, `flex`, `rounded-xl` — and you compose them directly in your markup. That sentence is easy to say and hard to picture, so the rest of this post is one small component built both ways.

## The same card, twice

Here's a card: an image, a title, a paragraph, a link. First the way most of us learned to write it.

```html
<article class="card">
  <img class="card__image" src="/coffee.jpg" alt="A cup of cold brew on a wooden table">
  <div class="card__body">
    <h2 class="card__title">Cold brew, at home</h2>
    <p class="card__text">Twelve hours, a jar, and coarse ground coffee. That's the whole recipe.</p>
    <a class="card__link" href="/recipes/cold-brew">Read the recipe</a>
  </div>
</article>
```

And the stylesheet that makes it real:

```css
.card {
  max-width: 20rem;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.card__image {
  display: block;
  width: 100%;
  height: 10rem;
  object-fit: cover;
}

.card__body { padding: 1rem; }

.card__title {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 600;
  color: #111827;
}

.card__text {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #4b5563;
}

.card__link {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  background-color: #2563eb;
  color: #ffffff;
  font-size: 0.875rem;
  text-decoration: none;
}

.card__link:hover { background-color: #1d4ed8; }
```

Nothing is wrong with that code. But notice what it costs: six class names you had to invent, a naming convention you have to remember, a second file you have to keep in sync with the first, and — the part that actually hurts six months later — no way to tell from the HTML what any of it looks like.

Now the same card in Tailwind:

```html
<article class="max-w-xs overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
  <img class="block h-40 w-full object-cover" src="/coffee.jpg" alt="A cup of cold brew on a wooden table">
  <div class="p-4">
    <h2 class="mb-2 text-lg font-semibold text-gray-900">Cold brew, at home</h2>
    <p class="mb-4 text-sm text-gray-600">Twelve hours, a jar, and coarse ground coffee. That's the whole recipe.</p>
    <a href="/recipes/cold-brew"
       class="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
      Read the recipe
    </a>
  </div>
</article>
```

Same card — near enough. The hex values above are v3-era approximations of v4's palette, which is defined in `oklch` and renders a slightly different blue. No stylesheet, no invented names, nothing to keep in sync.

To run it you need the build step wired up, not just the import. On a Vite project — which is how this site is set up — that means installing `tailwindcss` and `@tailwindcss/vite`, adding `tailwindcss()` to the `plugins` array in `vite.config.ts`, and then putting one line at the top of your CSS file:

```css
@import "tailwindcss";
```

## So what does "utility-first" actually mean

Look at `p-4`. It is a class whose entire definition is `padding: 1rem`. That's it. `text-sm` sets a font size and a line height. `rounded-md` sets a border radius. Every class does one thing and its name tells you which thing.

Because each class is a fixed, self-contained rule, three things follow:

- **The styles live in the markup, which is where you're already looking.** You read `mb-4 text-sm text-gray-600` and you know exactly what that paragraph looks like without opening another file.
- **You stop naming things.** Naming is genuinely one of the hardest parts of CSS, and utilities delete the problem. There is no `.card__body--compact` to argue about.
- **Deleting an element deletes its styles.** No orphaned rules accumulating in a stylesheet nobody dares to clean up.

The values aren't arbitrary either. `p-1` through `p-8` walk a consistent spacing scale, so a page built out of utilities tends to look coherent almost by accident.

## Responsive, hover, focus, dark mode

This is the part I would miss most if I stopped using it. Any utility takes a prefix, and the prefix is the condition:

```html
<article class="max-w-xs overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm
                md:flex md:max-w-2xl
                dark:border-gray-800 dark:bg-gray-900">
  <img class="block h-40 w-full object-cover md:h-auto md:w-48"
       src="/coffee.jpg" alt="A cup of cold brew on a wooden table">
  <div class="p-4">
    <h2 class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Cold brew, at home</h2>
    <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">Twelve hours, a jar, and coarse ground coffee.</p>
    <a href="/recipes/cold-brew"
       class="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm text-white
              hover:bg-blue-700
              focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900
              dark:bg-blue-500 dark:hover:bg-blue-400">
      Read the recipe
    </a>
  </div>
</article>
```

`md:flex` means "flex, from the medium breakpoint up". `hover:bg-blue-700` means "this background, on hover". `dark:bg-gray-900` follows the reader's system theme by default. No media queries, no pseudo-class selectors, no jumping between files to check which breakpoint you used.

## Customising the design tokens

You are not stuck with Tailwind's defaults. In Tailwind v4, configuration moved into your CSS file as an `@theme` block:

```css
@import "tailwindcss";

@theme {
  --color-brand: oklch(58% 0.11 180);
  --color-brand-dark: oklch(48% 0.10 180);
  --font-display: "Inter", ui-sans-serif, system-ui, sans-serif;
  --radius-card: 0.75rem;
}
```

Those variables generate classes. `--color-brand` gives you `bg-brand`, `text-brand`, `border-brand`; `--font-display` gives you `font-display`; `--radius-card` gives you `rounded-card`. So the link becomes:

```html
<a href="/recipes/cold-brew"
   class="inline-block rounded-card bg-brand px-4 py-2 font-display text-sm text-white hover:bg-brand-dark">
  Read the recipe
</a>
```

One note if you're reading older tutorials: projects still on Tailwind v3 configure all of this in a `tailwind.config.js` file instead, and that file is not how v4 works.

## "But now my markup is ugly"

This is the honest complaint about Tailwind and it deserves an honest answer: yes, a long class list is ugly, and the fix is not a shorter class list — it's fewer copies of it.

If you're writing that card once, leave it inline. If you're writing it twenty times, extract a component. In React:

```jsx
export function Card({ image, alt, title, href, children }) {
  return (
    <article className="max-w-xs overflow-hidden rounded-card border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <img className="block h-40 w-full object-cover" src={image} alt={alt} />
      <div className="p-4">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{children}</p>
        <a
          href={href}
          className="inline-block rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand-dark"
        >
          Read the recipe
        </a>
      </div>
    </article>
  );
}
```

Now the ugly class list exists in exactly one place, and every usage reads `<Card title="Cold brew, at home" ... />`. That's better than a CSS class would have been, because the structure is reused too, not just the styles.

Tailwind also has an `@apply` directive that folds utilities into a regular CSS class. It works, and it's the right tool when you can't create a component — but reach for a component first. `@apply` quietly reintroduces the naming problem and the second file you were trying to escape.

## When Tailwind is the wrong choice

I use Tailwind on most things I build, but "most" is not "all".

- **A tiny static page.** If you're styling one landing page with forty lines of CSS, a build step and a new vocabulary are more overhead than the CSS you're avoiding. Just write the CSS.
- **A team that already has a working design system.** If your company ships a component library people are happy with, replacing it with utilities is a large migration in exchange for a smaller win than you think.
- **Markup you can't easily edit.** Utility-first assumes you control the HTML. If your output comes from a CMS's rich text, a third-party widget, or an email template, you can't sprinkle classes onto elements you never see — that's a job for regular CSS selectors.
- **A project where nobody will learn the class names.** Tailwind has a real learning curve, and its payoff is fluency. If you're handing the project to someone who'll fight the vocabulary for the rest of its life, you've made their job harder, not easier.

If you're new to Tailwind, its syntax will feel overwhelming at first — I found the same thing. But once you get the hang of it, it's a much more direct way to write CSS, and the card above is the reason why: everything that card looks like is right there in the file you're already reading.

I write up the things I break and fix at [codewithgabo.com](https://codewithgabo.com/allpost?utm_source=devto&utm_medium=referral&utm_campaign=tailwind-css).
