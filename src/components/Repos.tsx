import { useState, useEffect } from "react";
import Card from "./card/Card";
import AnimatedSection from "./common/AnimatedSection";
import SEO from "./common/SEO";
import ReposGreeting from "./Greeting/ReposGreeting";
import github from "../assets/github.png";
import usePageTracking from "../hooks/useAnalytics";
import "./card/PostCard.css";

interface GithubRepo {
  id: number;
  name: string;
  description: string;
  html_url: string;
}

const Repos = () => {
  usePageTracking();
  const [allrepos, setallRepos] = useState<GithubRepo[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const reposPerPage = 6;
  const indexOfLastRepo = currentPage * reposPerPage;
  const indexOfFirstRepo = indexOfLastRepo - reposPerPage;
  const filteredRepos = allrepos.filter((repo) =>
    repo.name.toLowerCase().includes(search.toLowerCase())
  );
  const currentRepos = filteredRepos.slice(indexOfFirstRepo, indexOfLastRepo);

  useEffect(() => {
    const username = import.meta.env.VITE_GITHUB_USERNAME || "Gabbs27";
    const apiUrl = `https://api.github.com/users/${username}/repos?per_page=20&sort=updated`;
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `token ${token}`;
    }
    fetch(apiUrl, { headers })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }
        return response.json();
      })
      .then((data: GithubRepo[]) => {
        setallRepos(data);
      })
      .catch((error) => {
        console.error("Failed to fetch repos:", error);
      });
  }, []);

  const totalPages = Math.ceil(filteredRepos.length / reposPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <>
      <SEO
        title="Repositories - GitHub Projects"
        description="Explore Gabriel Abreu's GitHub repositories showcasing diverse development skills across various projects and technologies."
        keywords="GitHub repositories, open source projects, code portfolio, development projects"
        url="https://codewithgabo.com/#/repositorios"
      />
      <div className='min-h-screen p-12'>
        <section className='container mx-auto py-12'>
          <ReposGreeting />

          <div className="blog-search-container">
            <input
              type='text'
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder='Search repos...'
              className='blog-search'
              aria-label="Search repositories"
            />
          </div>

          {currentRepos.length > 0 ? (
            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {currentRepos.map((repo, index) => (
                <AnimatedSection
                  key={repo.id}
                  variant="fadeInUp"
                  duration={0.5}
                  delay={index * 0.1}>
                  <Card
                    image={github}
                    title={repo.name}
                    description={repo.description || "No description available"}
                    url={repo.html_url}
                    languages={[]}
                  />
                </AnimatedSection>
              ))}
            </div>
          ) : (
            <div className="blog-empty">
              <div className="blog-empty__icon">&#128187;</div>
              <p className="blog-empty__text">
                {search ? "No repos match your search." : "Loading repositories..."}
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <nav className="blog-pagination" aria-label="Pagination">
              {pageNumbers.map((number) => (
                <button
                  key={number}
                  onClick={() => setCurrentPage(number)}
                  className={`blog-pagination__btn ${
                    currentPage === number ? "blog-pagination__btn--active" : ""
                  }`}
                  aria-label={`Go to page ${number}`}
                  aria-current={currentPage === number ? "page" : undefined}>
                  {number}
                </button>
              ))}
            </nav>
          )}
        </section>
      </div>
    </>
  );
};

export default Repos;
