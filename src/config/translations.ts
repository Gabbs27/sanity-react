/**
 * Post language, and which posts are translations of each other.
 *
 * Sanity has no language field, so this map is the source of truth. It is small
 * and explicit on purpose: with 14 posts and two translated pairs, a hardcoded
 * table beats a schema migration. If the blog ever gets a third language or a
 * dozen more pairs, move it into the CMS.
 *
 * Two things depend on it:
 *
 * - `<html lang>`. Every page shipped lang="en", including the four Spanish
 *   posts. Screen readers pick the wrong pronunciation from that, and search
 *   engines the wrong locale.
 *
 * - hreflang. Without it the Spanish and English versions of the same post
 *   compete against each other in search instead of being served by locale.
 */

export type PostLang = "es" | "en";

const ORIGIN = "https://codewithgabo.com";

/** Only the posts that are not in the default language. */
const SPANISH_POSTS = new Set([
  "3-prompts-gemini-nano-banana-resultados",
  "auditoria-portfolio-20-problemas",
  "como-programo-con-claude-code-flujo-real",
  "editor-propio-vs-sanity-studio",
]);

/** Slug pairs for the same article in both languages. */
const PAIRS: Array<Record<PostLang, string>> = [
  {
    es: "auditoria-portfolio-20-problemas",
    en: "portfolio-audit-20-problems",
  },
  {
    es: "como-programo-con-claude-code-flujo-real",
    en: "how-i-actually-code-with-claude-code",
  },
];

export function langForSlug(slug?: string): PostLang {
  return slug && SPANISH_POSTS.has(slug) ? "es" : "en";
}

/**
 * hreflang map for a post, or undefined when it has no translation.
 * Includes the page's own URL, which a self-referencing hreflang requires.
 */
export function alternatesForSlug(slug?: string): Record<string, string> | undefined {
  if (!slug) return undefined;
  const pair = PAIRS.find((p) => p.es === slug || p.en === slug);
  if (!pair) return undefined;
  return {
    es: `${ORIGIN}/${pair.es}`,
    en: `${ORIGIN}/${pair.en}`,
    "x-default": `${ORIGIN}/${pair.en}`,
  };
}
