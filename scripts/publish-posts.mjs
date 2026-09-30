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
    slug: "diez-segundos-de-tu-voz",
    title: "Diez segundos de tu voz ya bastan para clonarla: qué hacer en tu casa",
    excerpt:
      "ElevenLabs ya clona una voz con diez segundos de audio, lo que dura una nota de voz " +
      "cortica. Qué cambió, cómo funciona la estafa sobre la que alertó la DICAT y la palabra " +
      "clave que recomienda el FBI para tu familia.",
    tags: ["Inteligencia Artificial", "Seguridad", "Estafas", "República Dominicana", "ElevenLabs"],
    markdown: resolve(ROOT, "docs/drafts/diez-segundos-de-tu-voz.md"),
    cover: "scripts/covers/out/voz-clonada-es.png",
  },
  {
    slug: "ten-seconds-of-your-voice",
    title: "Ten seconds of your voice is now enough to clone it: what to do at home",
    excerpt:
      "ElevenLabs now clones a voice from ten seconds of audio, the length of a short voice " +
      "note. What changed, how the scam the Dominican police warned about works, and the " +
      "family code word the FBI recommends.",
    tags: ["AI", "Security", "Scams", "Dominican Republic", "ElevenLabs"],
    markdown: resolve(ROOT, "docs/drafts/ten-seconds-of-your-voice.md"),
    cover: "scripts/covers/out/voz-clonada-en.png",
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
