import React from "react";
import { Helmet } from "react-helmet-async";

/**
 * SEO Component - Manejo de meta tags dinámicos para mejor SEO
 */

const SEO = ({
  title = "Gabriel Abreu - Full Stack Developer",
  description = "Portfolio of Gabriel Abreu, a passionate Full Stack Developer specializing in React, C#, and modern web technologies.",
  keywords = "Gabriel Abreu, Full Stack Developer, React Developer, C# Developer, Web Development, Portfolio",
  author = "Gabriel Abreu",
  image = "http://codewithgabo.com/images/og-image.png",
  url = "http://codewithgabo.com",
  type = "website",
}) => {
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

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Additional SEO */}
      <link rel="canonical" href={url} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
    </Helmet>
  );
};

export default SEO;


