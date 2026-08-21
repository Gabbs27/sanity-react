import { useEffect } from "react";

/**
 * SEO Component — per-page meta tags.
 *
 * Writes the tags imperatively instead of rendering them.
 *
 * The previous implementation used react-helmet-async, which does not work
 * under React 19: every route shipped the index.html title and canonical, so
 * Google saw 23 URLs all declaring themselves the homepage. React 19 can hoist
 * <title>/<meta>/<link> natively, but hoisting *appends* — it would leave two
 * of each, since index.html already ships a default set for crawlers that
 * don't run JS. Upserting by selector guarantees exactly one of each tag and
 * updates cleanly on every route change.
 */

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  image?: string;
  url?: string;
  type?: string;
  /** Keep a page out of the index (admin, auth, 404). */
  noindex?: boolean;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const SEO = ({
  title = "Gabriel Abreu - Full Stack Developer",
  description = "Portfolio of Gabriel Abreu, a passionate Full Stack Developer specializing in React, TypeScript, C#, and modern web technologies.",
  keywords = "Gabriel Abreu, Full Stack Developer, React Developer, C# Developer, Web Development, Portfolio",
  author = "Gabriel Abreu",
  image = "https://codewithgabo.com/og-image.jpg",
  url = "https://codewithgabo.com",
  type = "website",
  noindex = false,
}: SEOProps) => {
  const siteTitle = title.includes("Gabriel Abreu")
    ? title
    : `${title} | Gabriel Abreu`;

  useEffect(() => {
    document.title = siteTitle;

    upsertMeta("name", "description", description);
    upsertMeta("name", "keywords", keywords);
    upsertMeta("name", "author", author);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:title", siteTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:site_name", "Code With Gabo");

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:url", url);
    upsertMeta("name", "twitter:title", siteTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);

    upsertLink("canonical", url);
  }, [siteTitle, description, keywords, author, image, url, type, noindex]);

  return null;
};

export default SEO;
