/**
 * AdSense configuration — single source of truth.
 *
 * The publisher ID is public by design: it already ships in index.html's
 * adsbygoogle.js URL and in public/ads.txt, and it appears in the rendered
 * markup of every ad on every page. It was previously read from
 * VITE_ADSENSE_CLIENT_ID, which was never set in any .env file — and because
 * Vite inlines import.meta.env at build time, that silently compiled every ad
 * out of the production bundle. Hardcoding a value that is public anyway
 * removes a whole class of "ads vanished and nobody noticed" failure.
 */
export const ADSENSE_CLIENT_ID = 'ca-pub-2464529747764309'

/**
 * Ad unit IDs, from AdSense → Ads → By ad unit.
 *
 * These must be the numeric IDs AdSense mints for each unit (10 digits, e.g.
 * '7259870550') — the value it shows as data-ad-slot in the unit's snippet.
 * A non-numeric value is not rejected client-side: the tag forwards it as the
 * slot name, Google finds no such unit, and the slot silently goes unfilled.
 *
 * Until real IDs are pasted here, AdSlot renders nothing (see isValidSlotId),
 * so the site ships no broken <ins> markup for the AdSense reviewer to see.
 */
export const AD_SLOTS = {
  /** In-article unit, placed a third of the way into a post body. */
  inArticle: '2970675007',
  /** Display unit, between the post body and the newsletter CTA. */
  endOfPost: '9344511662',
} as const

/** AdSense ad unit IDs are numeric. Anything else will never fill. */
export function isValidSlotId(slotId: string): boolean {
  return /^\d{6,}$/.test(slotId)
}
