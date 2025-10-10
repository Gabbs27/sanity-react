import React, { useState, useEffect } from "react";
import axios from "axios";
import PostCard from "./card/PostCard";
import AnimatedSection from "./common/AnimatedSection";
import SEO from "./common/SEO";
import ReposGreeting from "./Greeting/ReposGreeting";
import github from "../assets/github.png";
import usePageTracking from "../hooks/useAnalytics";

const Repos = () => {
  usePageTracking();
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
    const apiUrl = `https://api.github.com/users/${process.env.REACT_APP_GITHUB_USERNAME}/repos?per_page=20`;
    const headers = {
      Authorization: `${process.env.REACT_APP_GITHUB_TOKEN}`,
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
    <>
      <SEO
        title="Repositories - GitHub Projects"
        description="Explore Gabriel Abreu's GitHub repositories showcasing diverse development skills across various projects and technologies."
        keywords="GitHub repositories, open source projects, code portfolio, development projects"
        url="http://codewithgabo.com/#/Repositorios"
      />
      <div className='min-h-screen p-12'>
        <section className='container mx-auto py-12'>
          <ReposGreeting />
          <div className='flex mt-6'>
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search Repos'
              className='ml-auto w-full md:w-64 p-2 mt-2 border border-gray-400 rounded-md focus:ring-pink-500'
              style={{ maxWidth: "100%" }}
              aria-label="Search repositories"
            />
          </div>
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {currentRepos.map((repo, index) => {
              return (
                <AnimatedSection
                  key={repo.id}
                  variant="fadeInUp"
                  duration={0.5}
                  delay={index * 0.1}>
                  <PostCard
                    image={github}
                    title={repo.name}
                    description={repo.description}
                    url={repo.html_url}
                    languages={[]}
                  />
                </AnimatedSection>
              );
            })}
          </div>
          <nav className='flex justify-center mt-0 mb-12' aria-label="Pagination">
            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => setCurrentPage(number)}
                className='mx-2 px-4 py-2 text-sm font-medium leading-5 text-white transition duration-150 ease-in-out bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-500 focus:outline-none focus:shadow-outline'
                style={{ backgroundColor: "#276461" }}
                aria-label={`Go to page ${number}`}
                aria-current={currentPage === number ? "page" : undefined}>
                {number}
              </button>
            ))}
          </nav>
        </section>
      </div>
    </>
  );
};

export default Repos;
