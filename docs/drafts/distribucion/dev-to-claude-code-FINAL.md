---
title: How I Actually Code with Claude Code: My Real Workflow on a Real Project
published: false
tags: ai, productivity, webdev, programming
cover_image: https://cdn.sanity.io/images/nnt7ytcd/production/7fd3232dc85c4dde59f786dcc78d0d405dca7119-1200x630.png?w=1000&fm=jpg&q=80
canonical_url: https://codewithgabo.com/how-i-actually-code-with-claude-code
---

There are two kinds of articles about coding with AI. The ones that generate a sorting function and conclude the profession is over, and the ones that show a dumb bug and conclude none of this works.

Neither one looks anything like my actual workday.

This is the third kind: the concrete workflow I use with Claude Code on this very site, three tasks I actually delegated, the trail in the repository to back it up, and a section on where it fails that runs as long as the section on where it works. That's the part I would have wanted to read.

## What it is, without the marketing

Claude Code is an agent that runs in your terminal, inside your repository. It reads your files, runs your commands, edits your code, makes your commits. It isn't editor autocomplete, and it isn't a separate chat window where you paste fragments back and forth.

That difference matters more than it sounds. An assistant that sees one file helps you write a function. An agent that sees the whole repo, runs the tests and reads the output can take a complete task off your hands. It's the difference between asking for advice and delegating work.

## My setup

Nothing exotic:

- The repo for this site: a React frontend on Vite, Sanity as the CMS, and a small backend of Vercel Functions.
- A `.claude/` folder in the project with the local config and permissions.
- A `docs/plans/` folder where every design and plan lives. This is the key piece, and I'll explain why in a second.
- Git worktrees when a big task deserves isolation from the current working tree.

And one rule of my own, which is what actually changed my results: **nothing big gets written without a written plan first.**

## The workflow: design, plan, execute

The temptation with an agent is to open the terminal and say "add me an admin panel." Sometimes that works. Often it produces something that runs but isn't what you wanted, and you find out after six hundred lines are already on disk.

So I split it into three phases, and I don't let them overlap.

**One: design.** Before touching code, a conversation. What problem are we solving, two or three approaches with their downsides, which one we pick and why. Out comes a design document in `docs/plans/`. Short, but written.

**Two: plan.** The design turns into a task-by-task plan. Which files each task touches, which test gets written first, which command verifies it, where the commit goes. My plans folder has files like `2026-04-28-slice-2-vercel-migration.md` and `2026-04-29-portfolio-audit-implementation.md`. Each one is a plan that got executed task by task.

**Three: execute.** Now the code. With the plan in front of it, the session doesn't drift. If something doesn't fit, it shows up right away, because there's a document saying what should be happening.

It sounds like bureaucracy, and I thought so at first. It isn't. The written plan is what turns "the agent did something weird" into "the agent went off script at step 4," which is a very different problem and a much easier one to fix.

## Three tasks I actually delegated

### The portfolio audit

I asked it to audit this site as if it belonged to a client. Read every public component, walk the routes on mobile and desktop, measure the build chunk sizes, count the real posts in Sanity.

It came back with **20 findings across four areas**, each with a priority and an effort estimate. Among them: a 993 KB unoptimized illustration, a sitemap containing zero of nine published posts, and a 404 page that hung forever on "Loading post...".

I wrote that one up in detail [in a separate post](https://codewithgabo.com/portfolio-audit-20-problems?utm_source=devto&utm_medium=referral&utm_campaign=claude-code), but what matters here is the division of labor: **the machine found, I prioritized.** The document came back with findings and no fixes, on purpose, so I would be the one deciding what got touched and what didn't. Three of the twenty I threw out.

### Migrating Express to Vercel Functions

I had a small Express server on Railway wrapping the Google Analytics API. It worked, but it cost money every month to sit there 24/7 serving a dashboard almost nobody visits.

Moving it to serverless functions was textbook work: pull the helpers into `api/_utils/`, turn the route into a handler, move the environment variables, verify the external contract didn't change. The frontend never noticed. The bill went to zero.

This is exactly the kind of task where delegating wins: mechanical, well defined, with an objective success criterion. It doesn't take judgment, it takes not getting twenty details in a row wrong. A machine does that better than I do at eleven at night.

### The sitemap generated from Sanity

My sitemap was a static file I had to edit by hand every time I published. Which is to say: never.

Now it's a script that runs on `prebuild`, queries Sanity with GROQ, and writes the file with every post and its real date. Eighty lines of Node, no new dependencies.

Small task, and that's exactly why it sat there for months. That's the pattern I've noticed most: what has saved me the most time isn't the big tasks, it's the forty-minute ones that had been on the list for half a year because they were never urgent enough.

## Where it fails

This is where most of these articles go blurry. Straight to it.

**It accepts your premise too fast.** If you say "fix this CSS bug," it will go looking for a CSS bug. If the real problem was route ordering, you may get a CSS fix that covers the symptom. Now, when something breaks, I describe the behavior and not my diagnosis. The difference in outcome is enormous.

**It's too agreeable about your ideas.** If you propose a bad approach, the default response tends to be helping you build it well. I explicitly ask for two or three options with their downsides before anything gets decided, because if I don't ask for alternatives, they don't show up.

**Context degrades in long sessions.** Over a session of several hours, the decisions from the first half hour get fuzzy. That's why the plan goes into a file instead of staying in the conversation: the file doesn't forget.

**It doesn't know what ugly looks like.** It can write a component that is correct, accessible, passes the tests, and looks bad. Visual judgment is still yours. On this site I've redone by hand a fair amount of CSS that was technically fine.

**And the big one: you are still responsible for what gets merged.** I read every diff. Not because I trust it less than a human colleague, but exactly as much as I'd check a human colleague. A commit with my name on it is mine, no matter who typed it.

**When it costs more than it saves:** tasks under ten minutes that I already know how to do, one-line changes, and anything where explaining the context takes longer than doing the thing. Writing a good prompt for a trivial change is net negative work.

## How to start tomorrow

If you want to try this without getting burned:

1. **Start with a boring, well-defined task.** Migrating a format, writing tests for something that already exists, updating dependencies. Don't start with your product's flagship feature.
2. **Ask for a plan before code.** Even when the task is small. Reading the plan tells you in thirty seconds whether you were understood, and fixing a plan is free compared to fixing an implementation.
3. **Work on a branch or a worktree.** So you can throw it all away without thinking twice if it goes sideways.
4. **Read the diffs.** All of them. If you're not going to read them, don't delegate.
5. **Leave the context in the repository, in writing.** Decisions that live only in a conversation get lost. The ones in `docs/plans/` are still there three months later, when you no longer remember why you chose that.

## What actually changed

I don't code faster. I code with less friction on the boring parts, which turn out to be most of the work.

The tasks that used to sit on the list out of inertia now get done, because the cost of starting them dropped enough. The sitemap had been pending for months. The audit for longer. Neither was hard; both were tedious, and tedious is exactly what piled up on me.

What didn't change: I still decide what gets built, I still review every line that goes in, and I'm still the one responsible when something breaks in production.

That seems right to me. It's the part of the job I like.

I write up the things I break and fix at [codewithgabo.com](https://codewithgabo.com/allpost?utm_source=devto&utm_medium=referral&utm_campaign=claude-code).
