This week I pulled Create React App out of one project and wrote the plan to pull it out of another. Both were from 2022 and 2023, and both still worked. That is the deceptive part: still working and still being the right way to do it are different things, and between the two, four large changes happened in React that do not announce themselves.

None of this is rumour. All four are on the official blog, with dates.

## 1. The compiler already deletes your `useMemo`

**React Compiler reached 1.0 on October 7, 2025.** Not beta, not an experiment: it automatically memoizes components and hooks, works in React and React Native, and installs through Babel, Vite or Rsbuild.

What that means in practice is that most of your `useMemo` and `useCallback` stopped being your job. You wrote them to avoid re-renders; the compiler does that optimization at build time, without rewriting anything.

There is one installation detail that catches people: **if you had `eslint-plugin-react-compiler`, it is gone.** You remove it and use `eslint-plugin-react-hooks@latest`, because the compiler's lint rules now ship inside its `recommended` and `recommended-latest` presets.

The compiler leans on the Rules of React. If a component breaks them, the compiler detects it and skips that component rather than optimizing it wrongly. Which means linter warnings stopped being cosmetic: they now decide whether your code gets optimized at all.

## 2. If you serve Server Components, you now have a patch calendar

This is the change that gets discussed least and can cost you most.

On **December 3, 2025**, React published a critical vulnerability in React Server Components: **CVE-2025-55182, CVSS 10.0**, the maximum score. An unauthenticated attacker could craft an HTTP request to any Server Function endpoint that, when deserialized by React, achieved **remote code execution on the server**.

It affected `react-server-dom-webpack`, `react-server-dom-parcel` and `react-server-dom-turbopack` in versions 19.0, 19.1.0, 19.1.1 and 19.2.0. Fixed in **19.0.1, 19.1.2 and 19.2.1**.

And the list of affected frameworks is the list of what people actually use: `next`, `react-router`, `waku`, `@parcel/rsc`, `@vitejs/plugin-rsc` and `rwsdk`.

**Eight days later came the second batch.** On December 11 two more were published:

- **Denial of service** (CVE-2025-55184, CVE-2025-67779 and CVE-2026-23864, CVSS 7.5): malicious requests to Server Function endpoints caused infinite loops that hang the process, eat CPU, and end in crashes or out-of-memory.
- **Source code exposure** (CVE-2025-55183, CVSS 5.3): a request could return the source of your Server Functions.

The detail in that last one is worth reading carefully, because it decides whether it touches you:

```js
'use server';

export async function serverFunction(name) {
  const conn = db.createConnection('SECRET KEY'); // exposed
  const user = await conn.createUser(name);
  return {
    id: user.id,
    message: `Hello, ${name}!` // exposed
  }
}
```

Only secrets **hardcoded in the source** are exposed. Ones coming from `process.env` are not. So: if you ever pasted a key straight into a file with `'use server'` to test something, that is the file.

Fixed in **19.0.4, 19.1.5 and 19.2.4**.

The operational conclusion is simple and it isn't about React: if your app serves Server Components, it stopped being a dependency you update when there's time. And if you use neither RSC nor a server, none of these reach you.

## 3. React 19.3 shipped things that used to be solved outside React

**It came out on September 9, 2026**, days ago.

**`<ViewTransition>`** animates elements as they enter, exit, move or resize, using the browser's View Transition API:

```js
import { ViewTransition } from 'react';

{isShowing && (
  <ViewTransition>
    <Component />
  </ViewTransition>
)}
```

React picks which animation to run based on how the tree changed: enter, exit, update or share. And when the same state update should animate differently depending on **why** it happened, `addTransitionType` marks the cause:

```js
function nextSlide() {
  startTransition(() => {
    addTransitionType('next');
    setCurrentSlide(c => c + 1);
  });
}
```

```js
<ViewTransition
  enter={{
    'next': 'from-right',
    'previous': 'from-left',
  }}
  exit={{
    'next': 'to-left',
    'previous': 'to-right',
  }}
>
  <Page />
</ViewTransition>
```

**Fragment refs** solve wanting to touch the DOM of a group of elements without wrapping it in a `div` you never needed:

```js
<Fragment ref={fragmentRef}>
  {posts.map(post => (
    <Heading key={post.id}>{post.title}</Heading>
  ))}
</Fragment>
```

The `FragmentInstance` carries a deliberately small set of methods: `addEventListener`, `removeEventListener`, `dispatchEvent`, `focus`, `focusLast`, `blur`, `observeUsing`, `unobserveUsing`, `getClientRects`, `getRootNode`, `compareDocumentPosition` and `scrollIntoView`.

`observeUsing` is the one I care about: attaching an `IntersectionObserver` to a list without manufacturing a container just to have something to hold.

**`browser()`** tells a component not to render on the server:

```js
import { use } from 'react';
import { browser } from 'react-dom';

function Component() {
  use(browser());
  // ...
}
```

During server rendering the nearest `Suspense` fallback shows. Once the component hydrates on the client, `use(browser())` no longer suspends and rendering continues normally. It is the official version of the `useEffect` plus `isClient` trick everyone has written.

**Trusted Types integration** also landed, which helps against DOM-based XSS: React now passes those values through without coercing them to strings, so the browser can validate them.

And one you don't see but feel: **transitions now render independently** instead of being entangled into a single render. A slow transition no longer holds up unrelated ones.

## 4. React no longer depends on Meta alone

The **React Foundation** was announced in October 2025, and on **February 24, 2026** its new home was published: the **Linux Foundation**.

Eight platinum founding members: Amazon, Callstack, Expo, Huawei, Meta, Microsoft, Software Mansion and Vercel. A board with a representative from each, and Seth Webster as executive director.

With a clarification worth reading in full: **React's technical governance is independent from that board.** Technical direction is still set by the people who contribute to and maintain React, not by the foundation's members.

If you only write components, this changes nothing tomorrow. It changes the five-year risk, which is the one you actually take on when you pick a framework.

## What to do with all of this

If I had to order it by urgency:

1. **If you serve Server Components, check your version today.** A CVSS 10.0 is not a negotiation.
2. **If you write `useMemo` by reflex, try the compiler.** And if you had the old ESLint plugin, remove it.
3. **If you have a project on Create React App**, React stopped recommending it on February 14, 2025. Migrating takes less than it looks.
4. **19.3 can wait**, but read it: there are things in there you are solving by hand right now.

**Sources:** [React 19.3](https://react.dev/blog/2026/09/09/react-19-3) · [React Compiler v1.0](https://react.dev/blog/2025/10/07/react-compiler-1) · [Critical vulnerability in RSC](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) · [DoS and source code exposure in RSC](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components) · [The React Foundation](https://react.dev/blog/2026/02/24/the-react-foundation)
