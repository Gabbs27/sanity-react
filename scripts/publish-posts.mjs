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
    slug: "la-ia-arreglo-el-bug-y-rompio-lo-demas",
    title: "La IA arregló el bug y rompió lo demás: cómo reviso lo que me cambia un agente",
    excerpt:
      "Le pedí a la IA que arreglara un bug y el chiste se escribió solo. Pero el 66 % de los " +
      "devs dice que la IA entrega soluciones que están casi bien. Cinco chequeos que hago para " +
      "revisar lo que me cambia un agente, empezando por el tamaño del diff.",
    tags: ["Inteligencia Artificial", "Claude Code", "Testing", "Code Review", "Git"],
    markdown: resolve(ROOT, "docs/drafts/la-ia-arreglo-el-bug-y-rompio-lo-demas.md"),
    cover: "scripts/covers/out/agente-bug-es.png",
  },
  {
    slug: "the-ai-fixed-the-bug-and-broke-everything-else",
    title: "The AI fixed the bug and broke everything else: how I review what an agent changes",
    excerpt:
      "Asking an AI to fix one bug makes a good joke, but 66% of developers say AI solutions " +
      "are almost right, but not quite. Five checks I use to review what a coding agent " +
      "changes, starting with the size of the diff.",
    tags: ["AI", "Claude Code", "Testing", "Code Review", "Git"],
    markdown: resolve(ROOT, "docs/drafts/the-ai-fixed-the-bug-and-broke-everything-else.md"),
    cover: "scripts/covers/out/agente-bug-en.png",
  },
  {
    slug: "rd-inteligente-lo-que-ensena-y-lo-que-pide",
    title: "RD Inteligente: lo que enseña, lo que pide y lo que dice la letra pequeña",
    excerpt:
      "El 10 de septiembre arrancó RD Inteligente, el curso gratis de IA del ITLA para un " +
      "millón de dominicanos. Leí el programa, los términos y la política de privacidad: qué " +
      "enseña, qué pide para entrar y tres cosas que conviene saber antes de dar la cédula.",
    tags: ["Inteligencia Artificial", "República Dominicana", "Privacidad", "Educación", "ITLA"],
    markdown: resolve(ROOT, "docs/drafts/rd-inteligente-lo-que-ensena-y-lo-que-pide.md"),
    cover: "scripts/covers/out/rd-inteligente-es.png",
  },
  {
    slug: "rd-inteligente-what-it-teaches-and-asks-for",
    title: "RD Inteligente: what the Dominican AI course teaches, asks for, and says in the fine print",
    excerpt:
      "On September 10 the Dominican Republic launched RD Inteligente, ITLA's free AI course " +
      "for a million people. I read the program, the terms and the privacy policy: what it " +
      "teaches, what it asks for, and three things worth knowing before handing over your ID.",
    tags: ["AI", "Dominican Republic", "Privacy", "Education", "Government"],
    markdown: resolve(ROOT, "docs/drafts/rd-inteligente-what-it-teaches-and-asks-for.md"),
    cover: "scripts/covers/out/rd-inteligente-en.png",
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
