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
const SCRATCH =
  "/private/tmp/claude-501/-Users-gabriel-Desktop-Proyectos-sanity-react/" +
  "b1730875-d52c-4e03-a3d3-f954e1624d1a/scratchpad";

const POSTS = [
  {
    slug: "verde-y-ciego",
    title: "Verde y ciego: cuando un check que pasa no significa nada",
    excerpt:
      "Un mensaje de commit que era exacto y un sitio sirviendo lo contrario. " +
      "Dos fallos de esta semana: un check mirando la superficie equivocada, y " +
      "un slot que nadie estaba mirando.",
    tags: ["Testing", "Verificación", "SEO", "React", "AdSense"],
    markdown: `${SCRATCH}/es-verde-y-ciego.md`,
    cover: "scripts/covers/out/verde-y-ciego.png",
  },
  {
    slug: "el-punto-ciego-de-la-auditoria",
    title: "El punto ciego de la auditoría: pesé el build, no la página",
    excerpt:
      "Le hice una auditoría a mi portfolio y llamé al paso de pesar el build " +
      "el que casi nadie hace. También era el paso que garantizaba que nunca " +
      "vería los 9.88 MB que servía el índice del blog.",
    tags: ["Auditoría", "Performance", "Imágenes", "Sanity", "React"],
    markdown: `${SCRATCH}/es-punto-ciego-auditoria.md`,
    cover: "scripts/covers/out/punto-ciego-auditoria.png",
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
