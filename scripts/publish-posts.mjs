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
    slug: "el-email-que-envias-no-es-el-que-leen",
    title: "El email que envías no es el que leen",
    excerpt:
      "Tres grupos de clientes de correo hacen tres cosas distintas con tu HTML, " +
      "y uno de ellos invierte hasta los fondos que pusiste oscuros a propósito. " +
      "Más lo que dice la investigación de NN/g sobre cómo se lee de verdad.",
    tags: ["Email", "Usabilidad", "Accesibilidad", "CSS", "Dark mode"],
    markdown: resolve(ROOT, "docs/drafts/el-email-que-envias-no-es-el-que-leen.md"),
    cover: "scripts/covers/out/email-es.png",
  },
  {
    slug: "the-email-you-send-is-not-the-email-they-read",
    title: "The email you send is not the email they read",
    excerpt:
      "Three groups of mail clients do three different things to your HTML, and " +
      "one of them inverts even the backgrounds you made dark on purpose. Plus " +
      "what NN/g's research says about how newsletters actually get read.",
    tags: ["Email", "Usability", "Accessibility", "CSS", "Dark mode"],
    markdown: resolve(ROOT, "docs/drafts/the-email-you-send-is-not-the-email-they-read.md"),
    cover: "scripts/covers/out/email-en.png",
  },
  {
    slug: "chrome-ya-trae-un-modelo-adentro",
    title: "Chrome ya trae un modelo adentro. No es el que están anunciando",
    excerpt:
      "El Prompt API no está estable en la web: es origin trial. Pero hay tres " +
      "APIs de IA estables desde Chrome 138 que puedes usar hoy, sin servidor y " +
      "sin que el texto del usuario salga de su máquina.",
    tags: ["IA", "Chrome", "JavaScript", "Gemini Nano", "Privacidad"],
    markdown: resolve(ROOT, "docs/drafts/chrome-ya-trae-un-modelo-adentro.md"),
    cover: "scripts/covers/out/chrome-ai-es.png",
  },
  {
    slug: "chrome-already-ships-a-model",
    title: "Chrome already ships a model. It isn't the one being announced",
    excerpt:
      "The Prompt API isn't stable on the web — it's an origin trial. But three " +
      "built-in AI APIs have been stable since Chrome 138, and you can ship them " +
      "today with no server and no user text leaving the device.",
    tags: ["AI", "Chrome", "JavaScript", "Gemini Nano", "Privacy"],
    markdown: resolve(ROOT, "docs/drafts/chrome-already-ships-a-model.md"),
    cover: "scripts/covers/out/chrome-ai-en.png",
  },
  {
    slug: "cuatro-trucos-de-css-que-ya-puedes-borrar",
    title: "Cuatro trucos de CSS que ya puedes borrar",
    excerpt:
      "contrast-color(), @scope, las style queries y :open llegaron a Baseline " +
      "este año. Cada uno elimina un truco que probablemente sigue vivo en tu " +
      "código porque creías que CSS no podía hacerlo.",
    tags: ["CSS", "Baseline", "Frontend", "Accesibilidad"],
    markdown: resolve(ROOT, "docs/drafts/cuatro-trucos-de-css-que-ya-puedes-borrar.md"),
    cover: "scripts/covers/out/css-2026-es.png",
  },
  {
    slug: "four-css-workarounds-you-can-delete",
    title: "Four CSS workarounds you can delete",
    excerpt:
      "contrast-color(), @scope, style queries and :open all reached Baseline " +
      "this year. Each one removes a workaround that is probably still alive in " +
      "your codebase because you believed CSS could not do it.",
    tags: ["CSS", "Baseline", "Frontend", "Accessibility"],
    markdown: resolve(ROOT, "docs/drafts/four-css-workarounds-you-can-delete.md"),
    cover: "scripts/covers/out/css-2026-en.png",
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
