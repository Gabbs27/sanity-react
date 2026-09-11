I almost wrote a different post.

It was going to be about the Prompt API: Gemini Nano running inside Chrome, no server, no API key, no per-token cost. I read it in several places and they all said the same thing, that Chrome 148 made it stable. Chrome 148 hit stable on May 5, 2026, so the date lined up.

I opened the official status table before writing. It says something else.

- **Translator** — stable, since Chrome 138
- **Language Detector** — stable, since Chrome 138
- **Summarizer** — stable, since Chrome 138
- **Prompt API in extensions** — stable, since Chrome 138
- **Prompt API on the web** — origin trial, Chrome 148
- **Writer, Rewriter and Proofreader** — developer trial, not shipped

There's the line the headlines lost. The Prompt API is stable **for extensions**. For a web page it's an origin trial, which is a different thing: you register, you get a token for your domain, and it expires.

What turned out to be interesting is what I found while checking: there are three AI APIs that have been stable since Chrome 138, that you can use today on an ordinary page, and that almost nobody is writing about.

## What you can actually ship today

Translation, no server:

```js
if ('Translator' in self) {
  // The API exists in this browser.
}

const availability = await Translator.availability({
  sourceLanguage: 'es',
  targetLanguage: 'fr',
});

const translator = await Translator.create({
  sourceLanguage: 'es',
  targetLanguage: 'fr',
});

await translator.translate('Where is the next bus stop, please?');
```

Summarization, also no server:

```js
const summarizer = await Summarizer.create({
  type: 'key-points',   // or 'tldr', 'teaser', 'headline'
  format: 'markdown',   // or 'plain-text'
  length: 'short',      // or 'medium', 'long'
});

await summarizer.summarize(longText, { context: 'For a reader in a hurry' });
```

And there's a streaming version, which on a long summary is the difference between a frozen screen and text appearing:

```js
for await (const chunk of summarizer.summarizeStreaming(longText)) {
  output.textContent += chunk;
}
```

The third is Language Detector, which does exactly what the name says and is the thing missing from nearly every multilingual contact form.

None of these three send anything to any server. The user's text never leaves their machine.

## `availability()` has four states, not two

Here's the part that makes this unlike calling a normal API. The model doesn't ship with the browser: it downloads onto your visitor's machine. So "is it available?" has four possible answers, not two:

- `"unavailable"` — this machine can't
- `"downloadable"` — it can, but hasn't yet
- `"downloading"` — it's coming down right now
- `"available"` — ready

Treat that return value as a boolean and the `downloadable` case turns into a permanent spinner. You have to trigger the download and show its progress:

```js
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'fr',
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
});
```

That `downloadprogress` isn't a nicety. It's the only way you get to tell someone why their browser has been quiet for two minutes.

## The cost that doesn't make the headlines

This is what to know before getting excited, and it comes from the same documentation:

- **Operating systems:** Windows 10 or 11, macOS 13 and up, Linux, or ChromeOS on Chromebook Plus.
- **Free space:** at least 22 GB.
- **Hardware:** strictly more than 4 GB of VRAM on the GPU, or 16 GB of RAM and 4 CPU cores.
- **Connection:** unlimited data or an unmetered one.
- **Mobile:** no. The Translator docs say it outright — these APIs don't work on mobile devices.

Add it up: an 8 GB laptop without a decent GPU is out. A phone is out, and phones are half your traffic or more.

There are finer details too. The Summarizer requires user activation before it initializes — you can't fire it just because the page loaded — and supports English, Japanese, Spanish, German and French. The Translator covers 40-plus languages. Outside Chrome, the Translator works in Edge 148; Firefox and Safari don't have it.

## So is it useful?

It is, with one condition: **it can never be the only path.**

The right shape is progressive enhancement. Your summary happens on the server, or it simply doesn't happen and you show the full text. If the browser turns out to carry the model, it happens there instead: free, instant, and without the user's text leaving their machine. If not, nobody finds out that branch existed.

That flips the economics of certain features. A summary per article costs tokens on a server and zero on the client. Translating your interface costs one call per language, or zero. And the privacy argument is real and verifiable: there's no network request to intercept because there's no network request.

## And the Prompt API

When it lands, it's the big one. It takes text, image and audio as input, and — this is what makes it genuinely usable — it lets you constrain the output to a regular expression or a JSON schema. That's the thing that makes wiring a model into code painful: not that it gets things wrong, but that it returns something your parser didn't expect. Chrome 148 also added the sampling parameters `temperature` and `topK`, in origin trial as well.

The session looks like this:

```js
const session = await LanguageModel.create();
const text = await session.prompt('Write me a poem!');

const stream = session.promptStreaming('Write me an extra-long poem!');
for await (const chunk of stream) { console.log(chunk); }

session.destroy();
```

It has a context window you can inspect with `session.contextUsage` against `session.contextWindow`. When it fills, the oldest exchanges get dropped, except the system prompt. If a prompt flat out doesn't fit, it throws a `QuotaExceededError` carrying `requested` and `contextWindow`, so you know by how much you overshot.

All of that is real and documented. What it isn't, yet, is stable on the web.

## What I'm taking from this

The fact that changed this post wasn't technical. It was that the word "stable" has a scope, and the scope doesn't travel attached to the word.

"The Prompt API is stable in Chrome 138" is true. It's true for extensions. For a web page it's an origin trial, and the difference between those two is whether you can build a product on it.

The table that clears this up is one click from every article I read. Finding out wasn't the cheap option. Repeating it was.

**Sources:** [Built-in AI APIs — Chrome for Developers](https://developer.chrome.com/docs/ai/built-in-apis) · [Translator API](https://developer.chrome.com/docs/ai/translator-api) · [Summarizer API](https://developer.chrome.com/docs/ai/summarizer-api) · [Prompt API](https://developer.chrome.com/docs/ai/prompt-api) · [Chrome 148 release notes](https://developer.chrome.com/release-notes/148)
