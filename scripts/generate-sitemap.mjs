/**
 * Build-time sitemap generator.
 *
 * Pulls all non-draft posts from Sanity and combines them with the
 * static route list, writing the result to public/sitemap.xml. Runs
 * automatically as `prebuild` so every deploy ships a fresh sitemap.
 *
 * Project ID + dataset are public values (also baked into the client
 * bundle), so it's fine to hardcode them here.
 */
import { createClient } from "@sanity/client";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITEMAP_PATH = resolve(__dirname, "../public/sitemap.xml");
const ORIGIN = "https://codewithgabo.com";

const client = createClient({
  projectId: "nnt7ytcd",
  dataset: "production",
  apiVersion: "2023-03-01",
  useCdn: true,
});

const STATIC_ROUTES = [
  { path: "/",              priority: 1.0, freq: "weekly"  },
  { path: "/about",         priority: 0.8, freq: "monthly" },
  { path: "/allpost",       priority: 0.9, freq: "weekly"  },
  { path: "/gabriel-abreu", priority: 0.7, freq: "monthly" },
  { path: "/repositorios",  priority: 0.6, freq: "monthly" },
  { path: "/services",      priority: 0.7, freq: "monthly" },
  { path: "/education",     priority: 0.6, freq: "monthly" },
  { path: "/privacy",       priority: 0.5, freq: "yearly"  },
  { path: "/terms",         priority: 0.5, freq: "yearly"  },
];

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[c]);
}

const today = new Date().toISOString().slice(0, 10);

const posts = await client.fetch(
  `*[_type=="post" && !(_id in path("drafts.**")) && defined(slug.current)]{
    "slug": slug.current,
    _updatedAt
  }`,
);

const urls = [
  ...STATIC_ROUTES.map((r) => ({
    loc: `${ORIGIN}${r.path}`,
    lastmod: today,
    changefreq: r.freq,
    priority: r.priority.toFixed(1),
  })),
  ...posts.map((p) => ({
    loc: `${ORIGIN}/${p.slug}`,
    lastmod: p._updatedAt.slice(0, 10),
    changefreq: "monthly",
    priority: "0.8",
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

writeFileSync(SITEMAP_PATH, xml);
console.log(
  `Sitemap generated: ${urls.length} URLs (${STATIC_ROUTES.length} static + ${posts.length} posts).`,
);
