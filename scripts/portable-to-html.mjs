/**
 * Portable Text to simple HTML.
 *
 * Shared by generate-rss.mjs and prerender.mjs. It lives here rather than in
 * either of them because two converters for the same content is how the two
 * copies drift apart — the same reason the translation table moved to JSON.
 *
 * Deliberately small: headings, paragraphs, lists, quotes, code and links are
 * everything these posts use, and the converter that writes them
 * (scripts/md-to-portable.mjs) cannot emit anything else.
 */
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

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

export { toHtml, esc };
