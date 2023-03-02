import React, { useEffect, useState } from "react";
import Card from "./card/Card";
import Fade from "react-reveal/Fade";
import { data } from "../assets/data";

import Greeting from "./Greeting/Greeting";

export default function Portfolio() {
  const [allPostsData, setAllPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const postsPerPage = 3;
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  let filteredPosts = allPostsData.filter((post) => {
    return post.title.toLowerCase().indexOf(search.toLowerCase()) !== -1;
  });
  const currentPosts = filteredPosts
    ? filteredPosts.slice(indexOfFirstPost, indexOfLastPost)
    : [];

  useEffect(() => {
    setAllPosts(data);
  }, []);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredPosts.length / postsPerPage); i++) {
    pageNumbers.push(i);
  }

  if (!data)
    return (
      <div className='py-12'>
        <div className='min-h-screen p-12 '>
          <div className='container mx-auto'>
            <Greeting />
          </div>
        </div>
      </div>
    );
  return (
    <div className='min-h-screen p-12'>
      <div className='container mx-auto py-12'>
        <Greeting />
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
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {currentPosts.map((item, index) => {
            return (
              <Fade key={item.id}>
                <Card
                  image={item.image}
                  title={item.title}
                  description={item.description}
                  url={item.url}
                  languages={item.languages}
                />
              </Fade>
            );
          })}
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
