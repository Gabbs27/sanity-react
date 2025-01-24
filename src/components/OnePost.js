import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import sanityClient from "../client";
import BlockContent from "@sanity/block-content-to-react";
import Fade from "react-reveal/Fade";
import "./OnePost.css";
import ReactGA from "react-ga";

import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/hljs";

ReactGA.initialize("G-76H28FJYRY");
ReactGA.pageview(window.location.pathname + window.location.search);

const OnePost = () => {
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

  if (!postData) return <div>Loading...</div>;

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
    <Fade>
      <article className='single-post'>
        <div className='post-header'>
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
              <span className='post-date'>
                {new Date(postData.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className='post-content'>
          <BlockContent
            blocks={postData.body}
            projectId={process.env.REACT_APP_SANITY_PROJECT_ID}
            dataset='production'
          />
        </div>
      </article>
    </Fade>
  );
};

export default OnePost;
