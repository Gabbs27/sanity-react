/**
 * Build-time RSS feed.
 *
 * Runs as part of `prebuild`, next to the sitemap generator, and writes
 * public/rss.xml from the published posts in Sanity.
 *
 * WHY: /rss.xml, /feed.xml and friends all answered HTTP 200 with the SPA
 * shell, because vercel.json rewrites everything it does not find on disk to
 * index.html. A reader looking for a feed got a page of HTML claiming to be
 * one, and dev.to — which imports posts by RSS and can set canonical_url back
 * to the original automatically — had nothing to read. Writing a real file
 * fixes both: Vercel resolves the filesystem before applying the rewrite.
 *
 * The full body goes in content:encoded so an importer gets the whole post,
 * not a teaser.
 */
import { createClient } from "@sanity/client";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RSS_PATH = resolve(__dirname, "../public/rss.xml");
const ORIGIN = "https://codewithgabo.com";
const TITLE = "Code With Gabo";
const DESCRIPTION =
  "Notes from what Gabriel Abreu is building — React, TypeScript, C#, and what breaks along the way. In English and Spanish.";

const client = createClient({
  projectId: "nnt7ytcd",
  dataset: "production",
  apiVersion: "2023-03-01",
  useCdn: true,
});

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const cdata = (s) => `<![CDATA[${String(s ?? "").replace(/]]>/g, "]]&gt;")}]]>`;

// Portable Text to simple HTML. Deliberately small: headings, paragraphs,
// lists, quotes, code and links are everything these posts use, and the
// converter that writes them (scripts/md-to-portable.mjs) cannot emit anything
// else.
function toHtml(blocks) {
  if (!Array.isArray(blocks)) return "";
  const out = [];
  let list = null;

  const inline = (block) => {
    const defs = Object.fromEntries((block.markDefs || []).map((d) => [d._key, d]));
    return (block.children || [])
      .map((span) => {
        let text = esc(span.text || "");
        for (const mark of span.marks || []) {
          if (mark === "strong") text = `<strong>${text}</strong>`;
          else if (mark === "em") text = `<em>${text}</em>`;
          else if (mark === "code") text = `<code>${text}</code>`;
          else if (defs[mark]?.href) text = `<a href="${esc(defs[mark].href)}">${text}</a>`;
        }
        return text;
      })
      .join("");
  };

  const closeList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };

  for (const block of blocks) {
    if (block?._type === "image") {
      closeList();
      const src = block.asset?.url || block.url;
      if (src) out.push(`<img src="${esc(src)}" alt="${esc(block.alt || "")}" />`);
      continue;
    }
    if (block?._type !== "block") continue;

    const wanted = block.listItem === "bullet" ? "ul" : block.listItem === "number" ? "ol" : null;
    if (wanted !== list) {
      closeList();
      if (wanted) {
        out.push(`<${wanted}>`);
        list = wanted;
      }
    }

    const html = inline(block);
    if (list) out.push(`<li>${html}</li>`);
    else if (block.style === "code") out.push(`<pre><code>${html}</code></pre>`);
    else if (block.style === "blockquote") out.push(`<blockquote><p>${html}</p></blockquote>`);
    else if (/^h[1-4]$/.test(block.style)) out.push(`<${block.style}>${html}</${block.style}>`);
    else if (html.trim()) out.push(`<p>${html}</p>`);
  }
  closeList();
  return out.join("\n");
}

const posts = await client.fetch(
  `*[_type=="post" && defined(slug.current) && !(_id in path("drafts.**"))]
     | order(publishedAt desc)[0...20]{
       "slug": slug.current,
       title,
       excerpt,
       publishedAt,
       "image": mainImage.asset->url,
       body[]{..., _type == "image" => { ..., "asset": asset->{url} }}
     }`
);

const items = posts
  .filter((p) => p.slug && p.title)
  .map((p) => {
    const url = `${ORIGIN}/${p.slug}`;
    const html = toHtml(p.body);
    const summary =
      (p.excerpt || "").trim() ||
      html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
    return `    <item>
      <title>${cdata(p.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <description>${cdata(summary)}</description>
      <content:encoded>${cdata(
        (p.image ? `<img src="${esc(p.image)}" alt="${esc(p.title)}" />\n` : "") + html
      )}</content:encoded>
    </item>`;
  })
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(TITLE)}</title>
    <link>${ORIGIN}</link>
    <description>${esc(DESCRIPTION)}</description>
    <language>es</language>
    <atom:link href="${ORIGIN}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

writeFileSync(RSS_PATH, xml, "utf8");
console.log(`[rss] ${posts.length} items -> public/rss.xml`);
