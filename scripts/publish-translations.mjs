/**
 * Publishes the English translations of the two Spanish posts.
 *
 * WHY THIS EXISTS: src/config/translations.ts declares two hreflang pairs whose
 * English halves were never published. Both Spanish posts therefore tell Google
 * "the English version lives here" and point at URLs that resolve to the SPA's
 * not-found page. Publishing these two documents, at exactly those slugs, is
 * what makes the annotation true.
 *
 * The slugs are not free-form: they must match PAIRS in src/config/translations.ts.
 *
 * Both posts have to land together — the Claude Code body links to
 * /portfolio-audit-20-problems, so publishing one alone ships a dead link.
 *
 * Auth comes from the Sanity CLI session (~/.config/sanity/config.json), so run
 * `sanity login` first. The token is read into memory and never logged.
 *
 *   node scripts/publish-translations.mjs            # creates drafts to review
 *   node scripts/publish-translations.mjs --publish  # creates them live
 */
import { createClient } from "@sanity/client";
import { readFileSync } from "fs";
import { homedir } from "os";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { mdToPortable } from "./md-to-portable.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PUBLISH = process.argv.includes("--publish");

function cliToken() {
  const path = resolve(homedir(), ".config/sanity/config.json");
  let token;
  try {
    token = JSON.parse(readFileSync(path, "utf8")).authToken;
  } catch {
    throw new Error(`No Sanity CLI config at ${path}. Run \`sanity login\` first.`);
  }
  if (!token) throw new Error("Sanity CLI config has no authToken. Run `sanity login` first.");
  return token;
}

const client = createClient({
  projectId: "nnt7ytcd",
  dataset: "production",
  apiVersion: "2023-03-01",
  token: cliToken(),
  useCdn: false,
});

// Slugs come from PAIRS in src/config/translations.ts. Changing one here without
// changing it there re-breaks the hreflang this script exists to fix.
// A stale CLI session still leaves an authToken on disk, so its presence proves
// nothing. Fail here with something readable instead of a client stacktrace 40
// lines deep once the first mutation is rejected.
try {
  await client.fetch("count(*[_type=='post'])");
} catch (err) {
  if (err?.statusCode === 401) {
    console.error(
      "Sanity rejected the CLI token (401 Session not found).\n" +
        "The session expired — the token on disk is stale, not missing.\n\n" +
        "  cd codewithgabo && npx sanity login\n"
    );
    process.exit(1);
  }
  throw err;
}

const POSTS = [
  {
    slug: "how-i-actually-code-with-claude-code",
    es: "como-programo-con-claude-code-flujo-real",
    title: "How I Actually Code with Claude Code: My Real Workflow on a Real Project",
    excerpt:
      'Not another "write a prompt and watch the magic" tutorial. This is the real ' +
      "workflow I use on this very site — three tasks I actually delegated, and the " +
      "part almost nobody writes about: where it fails.",
    markdown: "docs/drafts/distribucion/dev-to-how-i-actually-code-with-claude-code.md",
    cover: "scripts/covers/out/claude-code-en.png",
  },
  {
    slug: "portfolio-audit-20-problems",
    es: "auditoria-portfolio-20-problemas",
    title: "I Audited My Own Portfolio and Found 20 Problems",
    excerpt:
      "Auditing someone else's site is easy. Auditing your own, after two years of " +
      "defending every decision, is another thing entirely. I found 20 problems, and " +
      "five of them actually hurt.",
    markdown: "docs/drafts/distribucion/dev-to-portfolio-audit-20-problems.md",
    cover: "scripts/covers/out/audit-en.png",
  },
];

// OnePost renders block styles only. Anything else reaches PortableText with no
// registered component and disappears from the page silently.
const RENDERABLE = new Set(["normal", "h1", "h2", "h3", "h4", "blockquote", "code"]);

function validate(slug, body) {
  const problems = [];
  const keys = body.map((b) => b._key);
  if (keys.length !== new Set(keys).size) problems.push("duplicate _key");
  if (body.length < 20) problems.push(`only ${body.length} blocks`);
  for (const b of body) {
    if (b._type !== "block") problems.push(`unrenderable _type: ${b._type}`);
    if (b.style && !RENDERABLE.has(b.style)) problems.push(`unrenderable style: ${b.style}`);
    if (!Array.isArray(b.markDefs)) problems.push("block without markDefs");
    for (const span of b.children || []) {
      for (const mark of span.marks || []) {
        const known = ["strong", "em", "code", "underline", "strike-through"];
        if (!known.includes(mark) && !(b.markDefs || []).some((d) => d._key === mark)) {
          problems.push(`orphan mark: ${mark}`);
        }
      }
    }
  }
  if (problems.length) {
    throw new Error(`${slug}: ${[...new Set(problems)].join(", ")}`);
  }
}

for (const post of POSTS) {
  const existing = await client.fetch(`*[_type=="post" && slug.current==$s][0]._id`, {
    s: post.slug,
  });
  if (existing) {
    console.log(`[skip] ${post.slug} already exists (${existing})`);
    continue;
  }

  // The Spanish original supplies publishedAt's neighbourhood and proves the
  // pair it is supposed to answer to actually exists.
  const source = await client.fetch(
    `*[_type=="post" && slug.current==$s][0]{_id, publishedAt}`,
    { s: post.es }
  );
  if (!source) throw new Error(`Spanish source ${post.es} not found — check the slug`);

  const body = mdToPortable(readFileSync(resolve(ROOT, post.markdown), "utf8"));
  validate(post.slug, body);

  const asset = await client.assets.upload(
    "image",
    readFileSync(resolve(ROOT, post.cover)),
    { filename: `${post.slug}.png` }
  );

  const doc = {
    _type: "post",
    _id: PUBLISH ? undefined : `drafts.${crypto.randomUUID()}`,
    title: post.title,
    slug: { _type: "slug", current: post.slug },
    excerpt: post.excerpt,
    publishedAt: new Date().toISOString(),
    mainImage: {
      _type: "image",
      asset: { _type: "reference", _ref: asset._id },
    },
    sponsored: false,
    affiliateDisclosure: false,
    body,
  };

  const created = await client.create(doc);
  console.log(
    `[${PUBLISH ? "published" : "draft"}] ${post.slug} — ${body.length} blocks, ` +
      `cover ${asset._id}, doc ${created._id}`
  );
}

console.log(
  PUBLISH
    ? "\nDone. Verify: both URLs should now prerender their own title on the next build."
    : "\nDrafts created. Review in Studio, then re-run with --publish, or publish there."
);
