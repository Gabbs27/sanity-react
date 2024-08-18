import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import sanityClient from "../client.js";
import BlockContent from "@sanity/block-content-to-react";
import imageUrlBuilder from "@sanity/image-url";
import { Fade } from "react-reveal";
import NotFound from "./NotFound.js";
import ReactGA from "react-ga";

import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/hljs";

ReactGA.initialize("G-76H28FJYRY");
ReactGA.pageview(window.location.pathname + window.location.search);

const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  return builder.image(source);
}

export default function OnePost() {
  const [postData, setPostData] = useState(null);
  const { slug } = useParams();

  useEffect(() => {
    sanityClient
      .fetch(
        `*[slug.current == "${slug}"]{
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
          "authorImage": author->image,
          likes
        }`
      )
      .then((data) => {
        setPostData(data[0]);
        console.log("Fetched data:", data);
      })
      .catch(console.error);
  }, [slug]);

  if (!postData)
    return (
      <div>
        <NotFound />
      </div>
    );

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
      <div className='min-h-screen p-12'>
        <div className='container shadow-lg mx-auto bg-green-100 rounded-lg'>
          <div className='relative'>
            <div className='absolute h-full w-full flex items-center justify-center p-8'>
              {/* Title Section */}
              <div className='bg-white bg-opacity-75 rounded p-12'>
                <h2 className='cursive text-3xl lg:text-6xl mb-4 leading-normal lg:leading-relaxed'>
                  {postData.title}
                </h2>

                <div className='flex justify-center text-gray-800'>
                  <img
                    src={urlFor(postData.authorImage).url()}
                    className='w-10 h-10 rounded-full'
                    alt='Author is Gabriel'
                  />
                  <h4 className='cursive flex items-center pl-2 text-2xl'>
                    {postData.name}
                  </h4>
                </div>
              </div>
            </div>
            <img
              className='w-full object-cover rounded-t'
              src={urlFor(postData.mainImage).url()}
              alt=''
              style={{ height: "300px" }}
            />
          </div>
          {/* <button onClick={handleLike} className='like-button'>
            ❤️ {postData.likes || 0}
          </button> */}
          <div className='px-16 lg:px-48 py-12 lg:py-20 prose lg:prose-xl max-w-full'>
            <BlockContent
              blocks={postData.body}
              projectId={sanityClient.clientConfig.projectId}
              dataset={sanityClient.clientConfig.dataset}
              serializers={serializers}
            />
          </div>
        </div>
      </div>
    </Fade>
  );
}
