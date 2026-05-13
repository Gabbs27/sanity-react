import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import sanityClient, { urlFor } from "../client";
import { PortableText } from "@portabletext/react";
import AnimatedSection from "./common/AnimatedSection";
import SEO from "./common/SEO";
import LoadingSpinner from "./common/LoadingSpinner";
import NewsletterSignup from "./Newsletter/NewsletterSignup";
import AdSlot from "./Ads/AdSlot";
import NotFound from "./NotFound";
import "./OnePost.css";
import usePageTracking from "../hooks/useAnalytics";

import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/hljs";
interface SanityPostData {
  title: string;
  slug: { current: string };
  mainImage?: { asset: { _id: string; url: string } };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
  name?: string;
  publishedAt: string;
  sponsored?: boolean;
  affiliateDisclosure?: boolean;
}

// PortableText custom components — type assertions needed for block-level overrides
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const portableTextComponents: any = {
  types: {
    // Images may arrive in two shapes: with `asset` (uploaded via Sanity asset
    // pipeline) or with a raw `url` (uploaded via the BlockNote editor, which
    // stores the upload-endpoint URL directly — see blocksToPortable).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    image: ({ value }: { value: any }) => {
      const src = value?.asset
        ? urlFor(value).width(1600).fit("max").auto("format").url()
        : value?.url;
      if (!src) return null;
      return (
        <figure className='post-figure'>
          <img
            src={src}
            alt={value.alt || ""}
            loading='lazy'
            className='post-inline-image'
          />
          {value.caption && (
            <figcaption className='post-figcaption'>{value.caption}</figcaption>
          )}
        </figure>
      );
    },
  },
  block: {
    // For style: 'code' blocks, PortableText passes `children` as RENDERED
    // React nodes (spans), not strings — calling .join('') on those produces
    // "[object Object][object Object]..." garbage. Pull the raw text from
    // `value.children` (the underlying portable-text block) instead.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code: ({ value }: { value: any }) => {
      const codeString = Array.isArray(value?.children)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? value.children.map((c: any) => (typeof c?.text === "string" ? c.text : "")).join("")
        : "";
      return (
        <SyntaxHighlighter
          style={{ ...nightOwl }}
          wrapLines={true}
          className='syntax-highlight'>
          {codeString}
        </SyntaxHighlighter>
      );
    },
  },
};

const OnePost = () => {
  usePageTracking();
  const [postData, setPostData] = useState<SanityPostData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { slug } = useParams();

  useEffect(() => {
    setNotFound(false);
    setPostData(null);
    sanityClient
      .fetch(
        `*[slug.current == $slug]{
          title,
          slug,
          mainImage{
            asset->{
              _id,
              url
            }
          },
          body,
          "name": author->name,
          publishedAt,
          sponsored,
          affiliateDisclosure
        }`,
        { slug }
      )
      .then((data: SanityPostData[]) => {
        if (!data || data.length === 0) {
          setNotFound(true);
        } else {
          setPostData(data[0]);
        }
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) return <NotFound />;
  if (!postData) return <LoadingSpinner message="Loading post..." />;

  return (
    <>
      <SEO
        title={postData.title}
        description={postData.title}
        keywords="blog post, article, tutorial, web development"
        url={`https://codewithgabo.com/#/${slug}`}
      />
      <AnimatedSection variant="fadeInUp" duration={0.6}>
        <article className='single-post'>
          <header className='post-header'>
            {postData.mainImage && (
              <img
                src={postData.mainImage.asset.url}
                alt={postData.title}
                className='post-main-image'
              />
            )}
            <div className='post-header-content'>
              {postData.sponsored && (
                <span className='post-badge post-badge--sponsored' aria-label='Sponsored content'>
                  Sponsored
                </span>
              )}
              <h1 className='post-title'>{postData.title}</h1>
              <div className='post-meta'>
                {postData.name && (
                  <span className='post-author'>By {postData.name}</span>
                )}
                <time className='post-date' dateTime={postData.publishedAt}>
                  {new Date(postData.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
            </div>
          </header>

          <div className='post-content'>
            {postData.affiliateDisclosure && (
              <aside className='post-disclosure' role='note'>
                <strong>Disclosure:</strong> This post contains affiliate links. If you
                make a purchase through them I may earn a small commission at no
                extra cost to you. It helps keep this blog running — thank you.
              </aside>
            )}
            {/* In-article ad: split the body so AdSense can place a slot
                roughly a third of the way through. Falls back to a single
                <PortableText> render when the body is too short to split
                cleanly (under 4 blocks). */}
            {Array.isArray(postData.body) && postData.body.length >= 4 ? (
              <>
                <PortableText
                  value={postData.body.slice(0, 3)}
                  components={portableTextComponents}
                />
                <AdSlot slotId="in-article-1" format="fluid" layout="in-article" />
                <PortableText
                  value={postData.body.slice(3)}
                  components={portableTextComponents}
                />
              </>
            ) : (
              <PortableText
                value={postData.body}
                components={portableTextComponents}
              />
            )}
          </div>

          {/* End-of-post ad — between content and the newsletter CTA. */}
          <AdSlot slotId="end-of-post-1" format="auto" />

          <NewsletterSignup variant="inline" />
        </article>
      </AnimatedSection>
    </>
  );
};

export default OnePost;
