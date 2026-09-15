/**
 * Publishes new blog posts from markdown drafts.
 *
 * Generalises scripts/publish-translations.mjs, which had its two posts and
 * their slugs hardcoded because it existed to fix one specific hreflang bug.
 * This one takes the list from POSTS below.
 *
 * It uploads the cover, converts the markdown, validates the result against
 * what OnePost can actually render, and refuses to create a post whose slug
 * already exists.
 *
 * Auth comes from the Sanity CLI session (~/.config/sanity/config.json), so run
 * `sanity login` first. The token is read into memory and never logged.
 *
 *   node scripts/publish-posts.mjs            # creates drafts to review
 *   node scripts/publish-posts.mjs --publish  # creates them live
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

const POSTS = [
  {
    slug: "lo-de-claro-que-se-sabe-y-que-no",
    title: "Lo de Claro: qué se sabe, qué no, y qué hacer igual",
    excerpt:
      "Una afirmación sin verificar sobre 2.9 millones de registros, por qué la " +
      "confirmación siempre llega tarde, y las cosas que conviene hacer esta " +
      "semana aunque al final resulte falsa.",
    tags: ["Seguridad", "República Dominicana", "Privacidad", "2FA", "Telecomunicaciones"],
    markdown: resolve(ROOT, "docs/drafts/lo-de-claro-que-se-sabe-y-que-no.md"),
    cover: "scripts/covers/out/claro-es.png",
  },
  {
    slug: "the-claro-claim-what-is-known-and-what-is-not",
    title: "The Claro claim: what is known, what is not, and what to do anyway",
    excerpt:
      "An unverified claim about 2.9 million records, why confirmation always " +
      "arrives late, and what is worth doing this week even if it turns out to " +
      "be false.",
    tags: ["Security", "Dominican Republic", "Privacy", "2FA", "Telecom"],
    markdown: resolve(ROOT, "docs/drafts/the-claro-claim-what-is-known-and-what-is-not.md"),
    cover: "scripts/covers/out/claro-en.png",
  },
  {
    slug: "react-19-3-el-compilador-y-un-cvss-10",
    title: "React 19.3, el compilador y un CVSS 10: lo que cambió mientras no mirabas",
    excerpt:
      "El compilador llegó a 1.0 y borra tus useMemo, Server Components tuvo una " +
      "vulnerabilidad de puntuación máxima, y 19.3 trajo View Transitions, refs " +
      "en Fragment y browser().",
    tags: ["React", "React Compiler", "Server Components", "Seguridad", "Frontend"],
    markdown: resolve(ROOT, "docs/drafts/react-19-3-el-compilador-y-un-cvss-10.md"),
    cover: "scripts/covers/out/react-193-es.png",
  },
  {
    slug: "react-19-3-the-compiler-and-a-cvss-10",
    title: "React 19.3, the compiler, and a CVSS 10: what changed while you weren't looking",
    excerpt:
      "The compiler hit 1.0 and deletes your useMemo, Server Components took a " +
      "maximum-score vulnerability, and 19.3 brought View Transitions, Fragment " +
      "refs and browser().",
    tags: ["React", "React Compiler", "Server Components", "Security", "Frontend"],
    markdown: resolve(ROOT, "docs/drafts/react-19-3-the-compiler-and-a-cvss-10.md"),
    cover: "scripts/covers/out/react-193-en.png",
  },
];


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

// A stale CLI session still leaves an authToken on disk, so its presence proves
// nothing. Fail here with something readable rather than a client stacktrace.
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
  if (problems.length) throw new Error(`${slug}: ${[...new Set(problems)].join(", ")}`);
}

for (const post of POSTS) {
  const existing = await client.fetch(`*[_type=="post" && slug.current==$s][0]._id`, {
    s: post.slug,
  });
  if (existing) {
    console.log(`[skip] ${post.slug} already exists (${existing})`);
    continue;
  }

  const body = mdToPortable(readFileSync(post.markdown, "utf8"));
  validate(post.slug, body);

  const asset = await client.assets.upload("image", readFileSync(resolve(ROOT, post.cover)), {
    filename: `${post.slug}.png`,
  });

  const created = await client.create({
    _type: "post",
    _id: PUBLISH ? undefined : `drafts.${crypto.randomUUID()}`,
    title: post.title,
    slug: { _type: "slug", current: post.slug },
    excerpt: post.excerpt,
    tags: post.tags,
    publishedAt: new Date().toISOString(),
    mainImage: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
    sponsored: false,
    affiliateDisclosure: false,
    body,
  });

  console.log(
    `[${PUBLISH ? "published" : "draft"}] ${post.slug} — ${body.length} blocks, ` +
      `${post.tags.length} tags, doc ${created._id}`
  );
}

console.log(
  PUBLISH
    ? "\nDone. A redeploy is still required: the sitemap and RSS are generated in\n" +
        "prebuild, and the <head> in postbuild. Until then the posts exist only for\n" +
        "someone with the direct link."
    : "\nDrafts created. Review, then re-run with --publish."
);
