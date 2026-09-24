This week I made an Instagram reel: I ask the AI to fix a bug, "just that one", and it replies that it's done, and that while it was at it, it renamed my variables, updated 14 dependencies, moved the login to another framework and deleted some failing tests. "You're welcome."

It's an exaggerated joke, but every piece of it really happens. In Stack Overflow's 2025 survey, the top frustration with AI tools, cited by 66% of respondents, was "AI solutions that are almost right, but not quite." The second, at 45%, was that debugging AI-generated code takes more time.

The test part isn't made up either. When Anthropic launched Claude 4 in May 2025, one of the improvements it announced was that the new models were 65% less likely than Sonnet 3.7 to use shortcuts or loopholes to complete a task, on the tasks most susceptible to them. If the vendor itself measures it, it happens.

I code with Claude Code ([here's how](https://codewithgabo.com/how-i-actually-code-with-claude-code)), and these are the five things I do so an agent doesn't hand me a "fixed" that breaks everything else.

## 1. I ask with a scope and a way out

"Fix the login bug" leaves the door open to anything. I ask like this: what's wrong, where I think it is, what not to touch, and what to do if it has to be touched. For example:

> Login fails when the email has uppercase letters. Fix it in `auth/login.ts`. Don't touch the tests or the dependencies; if you think you need to, stop and tell me why.

The last part is the important one. An agent with no way to tell you "this is bigger than what you asked for" will solve the bigger thing on its own.

## 2. I look at the size before the change

Before reading a single line, I run this:

```
git diff --stat
```

If I asked for one bug and see thirty files, I don't read anything: I ask why. The size of the diff is the first check, and the cheapest.

## 3. I read the tests first

If the change touches tests, I read those before the code:

```
git diff -- '*.test.*'
```

A test that changed along with the code it tests is the signal I look for. Sometimes the change is right, because the behavior changed on purpose. But a test that went from failing to passing because it now expects something else, or one that disappeared, didn't fix anything.

## 4. I make skipping a check visible

This is the one that has helped me the most. The @codewithgabo reels come out of a suite I built in Remotion, and before exporting, a probe checks that the video changes every two seconds. If it sits still, the export is cancelled. There's a way out, and it's there on purpose: `"allowStatic": true` in the piece's file. It's one line, and it shows up in the diff by name.

This week, while moving two reels to a new design, the probe flagged a two-second stretch below the minimum, which is 0.6%. The short way out was that line. The agent fixed the reel instead: the closing text now writes itself by hand and gets underlined, and the stretch went up to 1.3%. I don't know if it would have taken the line on another day. What I know is that if it does, I'll see it.

The same goes for any test suite:

- **Keep `.only` and `.skip` out of main.** Playwright and Mocha have `--forbid-only`, Vitest rejects `.only` in CI by default, and the ESLint plugins for Jest and Vitest ship the `no-focused-tests` and `no-disabled-tests` rules.
- **Give the tests an owner.** With a `CODEOWNERS` file on GitHub and the branch rule that requires code owner review, a change to the tests folder doesn't get in without someone looking at it.
- **Give the agent rules too.** In Claude Code, a `PreToolUse` hook can block edits to certain paths, like your tests, or make it ask you first.

## 5. I don't trust how it felt

In July 2025, METR measured 16 experienced developers working on their own projects: with AI they took 19% longer, and afterwards they believed they had been 20% faster. In February 2026, METR published new data, with newer tools, suggesting they now do help. But METR itself said that, because of how the tasks ended up selected, the new data is "only very weak evidence," and it's changing the study's design.

So we still don't really know how much it speeds us up. What did become clear is that how it feels isn't a measurement. That's why the four rules above are checks that don't depend on how it went.

## What doesn't change

AI writes fast, and it keeps writing better. Reviewing is still my job, and yours. The agent that "fixed" the bug by deleting the test didn't lie to you: it delivered the only thing it measured as success, a passing test.

**Sources:** [Stack Overflow 2025 Developer Survey, AI section](https://survey.stackoverflow.co/2025/ai) · [Anthropic, Claude 4 launch (May 22, 2025)](https://www.anthropic.com/news/claude-4) · [METR, July 2025 study](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) · [METR, February 2026 update](https://metr.org/blog/2026-02-24-uplift-update/) · [Vitest: allowOnly](https://vitest.dev/config/allowonly) · [Playwright: forbidOnly](https://playwright.dev/docs/api/class-testconfig#test-config-forbid-only) · [ESLint for Jest: no-disabled-tests](https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/no-disabled-tests.md) · [ESLint for Vitest: no-disabled-tests](https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/docs/rules/no-disabled-tests.md) · [GitHub: CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) · [Claude Code: hooks](https://code.claude.com/docs/en/hooks)
