import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import sanityClient from "../client";
import BlockContent from "@sanity/block-content-to-react";
import AnimatedSection from "./common/AnimatedSection";
import SEO from "./common/SEO";
import LoadingSpinner from "./common/LoadingSpinner";
import "./OnePost.css";
import usePageTracking from "../hooks/useAnalytics";

import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/hljs";

const OnePost = () => {
  usePageTracking();
  const [postData, setPostData] = useState(null);
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
      .then((data) => setPostData(data[0]))
      .catch(console.error);
  }, [slug]);

  if (!postData) return <LoadingSpinner message="Loading post..." />;

  // Update your serializers to use the custom style
  const serializers = {
    types: {
      block: (props) => {
        if (props.node.style === "code") {
          const codeString = props.node.children
            .map((child) => child.text)
            .join("");
          return (
            <SyntaxHighlighter
              style={{ ...nightOwl }}
              wrapLines={true}
              className='syntax-highlight'>
              {codeString}
            </SyntaxHighlighter>
          );
        }
        return BlockContent.defaultSerializers.types.block(props);
      },
    },
  };

  const handleLike = () => {
    const currentLikes = postData.likes || 0;
    sanityClient
      .patch(postData._id)
      .set({ likes: currentLikes + 1 })
      .commit()
      .then((_updatedPost) => {
        setPostData({ ...postData, likes: currentLikes + 1 });
      })
      .catch((error) => console.error("Error liking post:", error));
  };

  return (
    <>
      <SEO
        title={postData.title}
        description={postData.title}
        keywords="blog post, article, tutorial, web development"
        url={`http://codewithgabo.com/#/${slug}`}
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
            <BlockContent
              blocks={postData.body}
              projectId={process.env.REACT_APP_SANITY_PROJECT_ID}
              dataset={process.env.REACT_APP_SANITY_DATASET}
            />
          </div>
        </article>
      </AnimatedSection>
    </>
  );
};

export default OnePost;
