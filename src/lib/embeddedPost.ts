/**
 * The post the prerender baked into this page.
 *
 * scripts/prerender.mjs writes build/<slug>/index.html with the post's data in
 * an inert <script id="post-data" type="application/json">: field for field,
 * what OnePost fetches. Reading it lets the first render be the article before
 * any request has left the browser, and lets a failed fetch leave the article
 * standing instead of turning it into a 404. The Soft 404 that motivated this
 * is written up in that script.
 *
 * The script is only valid for the URL it was baked for. A client-side
 * navigation to another post keeps the same document, and with it the same
 * script, so the slug is checked and anything else fetches as before.
 */
export const POST_DATA_ID = "post-data";

/** The post the prerender baked into this page, if it is the one for `slug`. */
export function readEmbeddedPost<T extends { slug?: { current?: string } }>(
  slug: string | undefined
): T | null {
  if (typeof document === "undefined") return null;
  const el = document.getElementById(POST_DATA_ID);
  if (!el || !el.textContent) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(el.textContent);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;

  const post = parsed as T;
  if (!slug || post.slug?.current !== slug) return null;
  return post;
}
