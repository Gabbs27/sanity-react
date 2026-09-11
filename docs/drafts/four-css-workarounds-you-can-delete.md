There's a category of code nobody ever revisits: the workaround you wrote three years ago because CSS couldn't do something, still sitting there because you still believe CSS can't do it.

That belief has an expiry date, and nothing tells you when it passes.

Four of those workarounds expired this year. All four are Baseline *newly available*, which means they work in the current versions of Chrome, Edge, Firefox and Safari, on desktop and mobile. It does not mean they work on your aunt's old phone — that's still your call — but it does mean you now have a date to look at instead of a hunch.

## 1. `contrast-color()` deletes your luminance function

If you've ever let a user pick a color, you wrote this or something near it:

```js
function contrastColor(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lum = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  return L > 0.179 ? '#000' : '#fff';
}
```

Then you had to push the result into a CSS variable from JavaScript, which means your button's text color now depends on a script having run. All of that to choose between white and black.

Now it's one line of CSS:

```css
.button {
  background: var(--user-color);
  color: contrast-color(var(--user-color));
}
```

`contrast-color()` takes any color and returns white or black, whichever contrasts most against it. If the two tie, it returns white. It targets the WCAG AA minimum of 4.5:1, and browsers are free to use better algorithms.

Available since April 2026.

Watch what it **doesn't** do: it returns white or black, nothing else. If your brand demands a specific gray or a dark navy, this won't help. It solves the common case, which is precisely the case where people get tired and hardcode white.

## 2. `@scope` deletes the naming discipline

The eternal problem: you want to style the images inside a block, but not the ones inside a `figure` inside that block. The historical answer was to never nest and to baptize everything with a convention the whole team had to remember.

```css
@scope (.feature) to (figure) {
  img {
    border: 5px solid black;
    background-color: goldenrod;
  }
}
```

That's a *donut scope*: the root `.feature` sets the upper bound, inclusive; the limit `figure` sets the lower one, exclusive. Everything between them gets the style, and everything inside the `figure` doesn't.

The interesting part isn't the syntax, it's what it removes. BEM and its relatives exist because a selector's scope couldn't be declared, so it had to be encoded into the name. Now it can be declared.

Baseline since March 2026.

## 3. Style queries delete the class that only existed to announce something

This is the newest of the four — Baseline in May 2026 — and the one fewest people know about.

The container queries everyone uses ask about size. Style queries ask about the value of a custom property on the container:

```css
@property --theme {
  syntax: "<color>";
  inherits: true;
  initial-value: red;
}

@container style(--theme: red) {
  output { font-weight: bold; }
}

@container style(--theme: green) or style(--theme: blue) {
  output { color: var(--theme); }
}
```

It takes `not`, `and` and `or`, so conditions compose.

The detail that makes it worth the trouble: **you don't need `container-type`.** Any element can be a style container. The default, `container-type: normal`, stops it from being a size container but leaves it working as a style container.

What it deletes: that `.theme-dark` class you put on the parent purely so the children could tell which mode they were in, duplicating information that already lived in a CSS variable two lines above.

## 4. `:open` deletes the listener

```css
details:open summary {
  border-bottom: 1px solid currentColor;
}
```

That used to be an `addEventListener('toggle')` adding and removing a class. One listener, one class, and a bug waiting for the day somebody opened the `details` through some other path.

`:open` matches elements that have an open state, while they're open. Baseline since May 2026.

The same batch brought `ToggleEvent.source`, which hands you the control element that triggered a popover's toggle — the question people usually end up answering with a global variable.

## What else moved, while you're here

- `lh` and `rlh` as length units: `lh` is the element's computed line-height, `rlh` the root element's. Both now *widely available*.
- `:user-invalid`, which only matches an invalid field **after** the user has interacted with it. The end of forms that shout red at you before you've typed a character.
- `clip-path` and `Navigator.userActivation`, both widely available now.
- `text-decoration-skip-ink: all`, to force the underline to skip every glyph.
- `SharedWorker`, reachable from several tabs or iframes at once.

## The honest part

*Newly available* does not mean "safe for all of your traffic." It means it works in the current versions of the four major browsers, and it might not work on older devices or browsers. Who actually uses your site is a question for your analytics, not for an article.

But that wasn't the question. The question was whether the workaround you're still carrying is still necessary, and that one does have an answer: a line on MDN, with a month and a year on it.

Worth reading that line before you write the next luminance function. You already wrote it once.

**Sources:** [contrast-color() — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/contrast-color) · [@scope — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope) · [Container size and style queries — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_size_and_style_queries) · [Baseline monthly digest, May 2026 — web.dev](https://web.dev/blog/baseline-digest-may-2026)
