You write the HTML. You open it in your mail client. It looks exactly the way you designed it. You hit send.

That is where the part you didn't see begins. Between your send button and your reader's eyes sits a program that may repaint your colors, invert your background, swallow your logo, or touch nothing at all. Which of those four happens has nothing to do with your code. It depends on which app that person opened the mail in.

"It looks fine in my client" is a true statement. The problem is how closely it resembles a different statement you never made: "it looks fine."

## There is no dark mode behavior. There are three

Litmus groups mail clients into three buckets, and the distance between those buckets is wider than you'd guess:

**No color changes.** Apple Mail, Gmail on desktop, AOL and Yahoo Mail leave your HTML exactly as it arrived, no matter what the client's own interface is set to.

**Partial inversion.** Outlook.com and some Outlook mobile apps flip light backgrounds to dark and leave the already-dark ones alone.

**Full inversion.** The Gmail app on iOS, Outlook 2021 on Windows and Office 365 on Windows invert every color, light and dark alike.

Read that last group again. **They invert dark backgrounds too.** If you deliberately designed a dark card, those clients hand it back to you light. A design decision becomes a design bug without anyone touching the code.

## The two tags that say you handled it

```html
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
```

They go in the email's `<head>`, and what they do is tell the client that you took care of dark mode yourself, so it doesn't apply its automatic inversion on top of you. Then the CSS:

```css
@media (prefers-color-scheme: dark) {
  body { background-color: #272623 !important; }
  h1, h2, p { color: #ffffff !important; }
}
```

That `!important` isn't sloppiness. In email you aren't competing with your own styles, you're competing with the ones the client injects over yours.

## The pure white trap

Here's the detail that feels unfair and is real: once you add the tags above, **avoid pure white** (`#ffffff`) as a background. Apple Mail will invert it anyway. An off-white — barely off — stays where you put it.

Then there's the logo. If your logo is a PNG with a transparent background and dark lettering, on a dark background it doesn't look bad, it looks like nothing. The fix is a translucent outline so it stays legible either way, or midtones with enough contrast against both.

If you want to swap the image entirely, `@media (prefers-color-scheme: dark)` covers most clients, and Outlook on Android needs the `[data-ogsc]` prefix.

## But dark mode is not your biggest problem

Everything above is about how the email looks. Nielsen Norman Group's research is about something less comfortable: how it gets read.

Their newsletter usability report comes out of six rounds of studies over sixteen years, starting in 2002, with real users in the United States, Australia, England, Hong Kong, Japan and Sweden, testing more than 500 newsletters. It produced 199 design guidelines across 537 pages.

The findings that actually change how you write:

**People scan, they don't read.** We know this about web pages and forget it about email, which is where it hurts most, because your email is competing with forty others.

**Reading on a phone is still uncomfortable.** Users rated the ease of reading newsletters on their phones a 3.3 out of 7. That isn't a disaster; it's mediocre, which is worse, because nobody files a complaint about mediocre.

**"Mobile newsletter" is a misnomer.** Only 7% of newsletters would have been read on a phone only. The normal pattern is the same person reading on a computer sometimes and a phone other times. You aren't designing for a device, you're designing for a person who switches devices.

**The subject line and the from field carry almost all the weight.** And there, clarity beats cleverness every time. The study cites a real one from InterContinental Hotels: *"Open Your (I)s to the Wonders of the Sea."* A pun somebody celebrated in a meeting. The study's conclusion is that people simply don't have time for word plays.

**The valuable part goes first.** Fewer and fewer readers get past the opening, so burying the good stuff in the middle is equivalent to not writing it.

## The list you can actually check before sending

- **Descriptive alt text on every image.** When a client blocks images — and many do by default — the alt text *is* the email.
- **Absolute URLs.** Mail clients don't resolve relative paths. A `/images/logo.png` simply doesn't exist there.
- **Images on a publicly reachable host.** Behind a login or an internal network, nobody sees them.
- **Buttons at least 44 pixels.** That's the size of a finger, not an aesthetic preference.
- **Contrast and typography.** Most accessibility failures in email reduce to these two, and they're the two easiest to check before you send.

## What looking at it won't fix

Everything above is checkable. What isn't is looking at your email in your client and concluding something about the email.

It's the same trap wearing a different costume: you verified the surface that was within reach, not the one your reader looks at. On a website that means reading the DOM instead of the HTML the server actually serves. In an email it means reading the one inbox you happen to have open and calling that a test.

The honest version of "it looks fine" is "it looks fine in Apple Mail, in light mode, on a laptop screen." Written out, it stops sounding like a conclusion. It sounds like what it is: one data point, from one client, out of the three groups that exist.

**Sources:** [The Ultimate Guide to Dark Mode — Litmus](https://www.litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers) · [E-Mail Newsletters: Increasing Usability — Nielsen Norman Group](https://www.nngroup.com/articles/e-mail-newsletters-usability/) · [Marketing Email and Newsletter Usability (report) — NN/g](https://www.nngroup.com/reports/email-newsletter-design/)
