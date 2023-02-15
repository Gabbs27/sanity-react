import React, { useState, useEffect } from "react";
import axios from "axios";
import PostCard from "./card/PostCard";
import Fade from "react-reveal/Fade";
import Greeting from "./Greeting/PostGreeting";
import github from "../assets/github.png";

const Repos = () => {
  const [allrepos, setallRepos] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const reposPerPage = 6;
  const indexOfLastRepo = currentPage * reposPerPage;
  const indexOfFirstRepo = indexOfLastRepo - reposPerPage;
  let filteredRepos = allrepos.filter((repo) => {
    return repo.name.toLowerCase().indexOf(search.toLowerCase()) !== -1;
  });
  const currentRepos = filteredRepos
    ? filteredRepos.slice(indexOfFirstRepo, indexOfLastRepo)
    : [];

  useEffect(() => {
    const apiUrl = `https://api.github.com/users/Gabbs27/repos?per_page=20`;
    const headers = {
      Authorization: "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",
    };
    axios
      .get(apiUrl, { headers })
      .then((response) => {
        setallRepos(response.data);
        console.log(github);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredRepos.length / reposPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className='min-h-screen p-12'>
      <div className='container mx-auto'>
        <Greeting />
        <div className='flex mt-6'>
          <input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search posts'
            className='ml-auto w-64 p-2 mt-2 border border-gray-400 rounded-md focus:ring-pink-500'
          />
        </div>
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {currentRepos.map((repo) => {
            return (
              <Fade key={repo.id}>
                <PostCard
                  image={github} // replace with image URL if available
                  title={repo.name}
                  description={repo.description}
                  url={repo.html_url}
                  languages={[]} // replace with repository languages if available
                />
              </Fade>
            );
          })}
        </div>
        <div className='flex justify-center mt-12'>
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
};

export default Repos;
