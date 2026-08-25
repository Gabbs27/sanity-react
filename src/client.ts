import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
// v2 exports its types from the package root. The deep path
// "@sanity/image-url/lib/types/types" is a v1 layout that no longer exists,
// so the import resolved to nothing — invisible to the build, since Vite
// strips types without checking them, but a type error under tsc.
import type { SanityImageSource } from "@sanity/image-url";

const client = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: import.meta.env.VITE_SANITY_DATASET,
  useCdn: true,
  apiVersion: import.meta.env.VITE_SANITY_API_VERSION,
});

const builder = imageUrlBuilder(client);

export const urlFor = (source: SanityImageSource) => builder.image(source);

/**
 * Sizes a Sanity CDN image URL for the box it is actually displayed in.
 *
 * Every card on the site rendered `mainImage.asset.url` — the original upload —
 * and let CSS scale it down. /allpost shipped 9.88 MB of images for sixteen
 * ~250px cards; the heaviest cover is a 2160x2700 PNG at 3.13 MB. The same
 * sixteen come to 185 KB once sized.
 *
 * Takes the plain CDN URL rather than an image object, because the queries
 * feeding those cards project `asset->{url}` and not the reference `urlFor`
 * needs. Same CDN, same parameters, no query rewrite.
 *
 * `auto=format` negotiates on the request's Accept header, so a modern browser
 * gets WebP or AVIF and anything older still gets the original format. `fit=max`
 * only ever scales down, so a small source is never upscaled.
 */
export function sizedImage(url: string | undefined | null, width: number): string {
  if (!url) return "";
  // Non-Sanity URLs (the BlockNote editor stores upload-endpoint URLs directly)
  // do not understand these parameters.
  if (!url.includes("cdn.sanity.io")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}w=${width}&fit=max&auto=format&q=75`;
}

/**
 * Sizes an image for a social card.
 *
 * Separate from sizedImage because the constraint is different. A card is a
 * fixed 1.91:1 frame, and an image that does not match it gets cropped by
 * whoever renders the card. Seven of eighteen covers here are portrait or
 * 1.75:1, including one 2160x2700, so those cards were being framed by
 * Twitter's rules instead of mine. fit=crop moves that decision somewhere I
 * can see it.
 *
 * Format is forced rather than negotiated: a social crawler is not a browser
 * and may not advertise WebP in its Accept header, so auto=format would be
 * gambling the card on a guess about a client I never see.
 */
export function socialImage(url: string | undefined | null): string {
  if (!url) return "";
  if (!url.includes("cdn.sanity.io")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}w=1200&h=630&fit=crop&fm=jpg&q=80`;
}

export default client;
