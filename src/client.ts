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

export default client;
