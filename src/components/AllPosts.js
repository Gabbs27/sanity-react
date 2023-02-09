import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Fade from "react-reveal/Fade";
import sanityClient from "../client.js";
import PostCard from "./card/PostCard";
import PostGreeting from "./Greeting/PostGreeting";

export default function AllPosts() {
  const [allPostsData, setAllPosts] = useState(null);

  useEffect(() => {
    sanityClient
      .fetch(
        `*[_type == "post"]{
        title,
        slug,
        mainImage{
        asset->{
          _id,
          url
        }
      }
    }`
      )
      .then((data) => {
        setAllPosts(data);
        console.log(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className='min-h-screen p-12'>
      <div className='container mx-auto'>
        <PostGreeting />
        {/* <h2 className='text-3xl flex justify-center'>All Posts</h2>
        <h3 className='text-lg text-gray-600 flex justify-center mb-12'>
          Welcome Code With Gabo!
        </h3> */}
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {allPostsData &&
            allPostsData.map((post, index) => (
              <Fade key={post.slug.current}>
                <Link to={"/" + post.slug.current} key={post.slug.current}>
                  <PostCard
                    image={post.mainImage.asset.url}
                    title={post.title}
                    description=''
                    url={"/" + post.slug.current}
                    languages={[]}
                  />
                </Link>
              </Fade>
            ))}
        </div>
      </div>
    </div>
  );
}
