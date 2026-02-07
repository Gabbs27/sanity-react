import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import sanityClient from "../client";
import { PortableText } from "@portabletext/react";
import AnimatedSection from "./common/AnimatedSection";
import SEO from "./common/SEO";
import LoadingSpinner from "./common/LoadingSpinner";
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
}

// PortableText custom components — type assertions needed for block-level overrides
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const portableTextComponents: any = {
  block: {
    code: ({ children }: { children?: string | string[] }) => {
      const codeString = Array.isArray(children) ? children.join("") : children || "";
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
  const { slug } = useParams();

  useEffect(() => {
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
          publishedAt
        }`,
        { slug }
      )
      .then((data: SanityPostData[]) => setPostData(data[0]))
      .catch(console.error);
  }, [slug]);

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
            <PortableText
              value={postData.body}
              components={portableTextComponents}
            />
          </div>
        </article>
      </AnimatedSection>
    </>
  );
};

export default OnePost;
