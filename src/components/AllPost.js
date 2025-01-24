import React, { useState, useEffect } from "react";
import sanityClient from "../client";
import PostCard from "./PostCard";
import PostGreeting from "./Greeting/PostGreeting";
import Fade from "react-reveal/Fade";
import "./AllPost.css";

const AllPost = () => {
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    sanityClient
      .fetch(
        `*[_type == "post"] | order(publishedAt desc) {
          title,
          slug,
          mainImage{
            asset->{
              _id,
              url
            }
          },
          publishedAt,
          excerpt
        }`
      )
      .then((data) => setPosts(data))
      .catch(console.error);
  }, []);

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className='min-h-screen p-12 bg-background'>
      <PostGreeting />
      <div className='container mx-auto'>
        <div className='search-container'>
          <input
            type='text'
            placeholder='Search posts...'
            className='search-input'
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className='posts-grid'>
          {filteredPosts.map((post, index) => (
            <Fade
              bottom
              duration={1000 + index * 200}
              distance='40px'
              key={post.slug.current}>
              <PostCard post={post} />
            </Fade>
          ))}
        </div>
      </div>
    </main>
  );
};

export default AllPost;
