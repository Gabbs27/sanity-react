import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Fade from "react-reveal/Fade";
import sanityClient from "../client.js";
import PostCard from "./card/PostCard";
import PostGreeting from "./Greeting/PostGreeting";
import ReactGA from "react-ga";
ReactGA.initialize("G-76H28FJYRY");
ReactGA.pageview(window.location.pathname + window.location.search);
export default function AllPosts() {
  const [allPostsData, setAllPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const postsPerPage = 6;
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  let filteredPosts = allPostsData.filter((post) => {
    return post.title.toLowerCase().indexOf(search.toLowerCase()) !== -1;
  });
  const currentPosts = filteredPosts
    ? filteredPosts.slice(indexOfFirstPost, indexOfLastPost)
    : [];

  useEffect(() => {
    sanityClient
      .fetch(
        `*[_type == "post"] | order(publishedAt desc){
            title,
            slug,
            mainImage{
            asset->{
              _id,
              url
            },
          },
          publishedAt
        }`
      )
      .then((data) => setAllPosts(data))
      .catch(console.error);
  }, []);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }; // Customize the format
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredPosts.length / postsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className='min-h-screen p-12'>
      <div className='container mx-auto py-12'>
        <PostGreeting />
        <div className='flex mt-6'>
          <input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search posts'
            className='ml-auto w-full md:w-64 p-2 mt-2 border border-gray-400 rounded-md focus:ring-pink-500'
            style={{ maxWidth: "100%" }}
          />
        </div>
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6'>
          {currentPosts.map((post, index) => (
            <Fade key={post.slug.current}>
              <>
                <Link to={"/" + post.slug.current} key={post.slug.current}>
                  <PostCard
                    image={post.mainImage.asset.url}
                    title={post.title}
                    description={formatDate(post.publishedAt)}  
                    url={"/" + post.slug.current}
                    languages={[]}
                  />
                </Link>
              </>
            </Fade>
          ))}
        </div>
        <div className='flex justify-center mt-0 mb-12'>
          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => setCurrentPage(number)}
              className='mx-2 px-4 py-2 text-sm font-medium leading-5 text-white transition duration-150 ease-in-out bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-500 focus:outline-none focus:shadow-outline'
              style={{ backgroundColor: "#276461" }}>
              {number}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
