import { Helmet } from "react-helmet-async";

/**
 * SEO Component - Manejo de meta tags dinámicos para mejor SEO
 */

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEO = ({
  title = "Gabriel Abreu - Full Stack Developer",
  description = "Portfolio of Gabriel Abreu, a passionate Full Stack Developer specializing in React, TypeScript, C#, and modern web technologies.",
  keywords = "Gabriel Abreu, Full Stack Developer, React Developer, C# Developer, Web Development, Portfolio",
  author = "Gabriel Abreu",
  image = "https://codewithgabo.com/og-image.png",
  url = "https://codewithgabo.com",
  type = "website",
}: SEOProps) => {
  const siteTitle = title.includes("Gabriel Abreu")
    ? title
    : `${title} | Gabriel Abreu`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="title" content={siteTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Code With Gabo" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO */}
      <link rel="canonical" href={url} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
    </Helmet>
  );
};

export default SEO;
