/**
 * Post language, and which posts are translations of each other.
 *
 * Sanity has no language field, so translations.json is the source of truth.
 * It is small and explicit on purpose: with 16 posts and two translated pairs,
 * a hardcoded table beats a schema migration. If the blog ever gets a third
 * language or a dozen more pairs, move it into the CMS.
 *
 * The data sits in JSON rather than in this file because scripts/prerender.mjs
 * needs the same table at build time and cannot import a TypeScript module.
 * Keeping two copies in sync by hand is how a table like this rots.
 *
 * Three things depend on it:
 *
 * - `<html lang>`. Every page shipped lang="en", including the Spanish posts.
 *   Screen readers pick the wrong pronunciation from that, and search engines
 *   the wrong locale.
 *
 * - hreflang. Without it the Spanish and English versions of the same post
 *   compete against each other in search instead of being served by locale.
 *
 * - Related posts. "Sigue leyendo" should not send a Spanish reader to an
 *   English article, nor offer the same article they are already reading in
 *   another language.
 */
import data from "./translations.json";

export type PostLang = "es" | "en";

const ORIGIN = "https://codewithgabo.com";

const SPANISH_POSTS = new Set<string>(data.spanishPosts);

const PAIRS: Array<Record<PostLang, string>> = data.pairs;

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

/** The other half of a translation pair, if there is one. */
export function translationOf(slug?: string): string | undefined {
  if (!slug) return undefined;
  const pair = PAIRS.find((p) => p.es === slug || p.en === slug);
  if (!pair) return undefined;
  return pair.es === slug ? pair.en : pair.es;
}
