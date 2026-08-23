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

export default client;
