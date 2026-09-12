import { useState, useEffect } from "react";
import RepoCard from "./card/RepoCard";
import AnimatedSection from "./common/AnimatedSection";
import SEO from "./common/SEO";
import ReposGreeting from "./Greeting/ReposGreeting";
import usePageTracking from "../hooks/useAnalytics";
import "./card/PostCard.css";
import snapshot from "../config/repos.json";

interface GithubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics?: string[];
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
    // mediaType.preview enables `topics` in the response
    const apiUrl = `https://api.github.com/users/${username}/repos?per_page=20&sort=updated`;
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.mercy-preview+json",
    };
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
        // Unauthenticated GitHub allows 60 requests an hour per IP, so this
        // fails for real visitors, not just in theory, and the page used to go
        // permanently empty when it did. Fall back to the committed snapshot —
        // the same one scripts/prerender.mjs writes into this page's noscript.
        //
        // It is a fallback and not the initial state on purpose: seeding it
        // would put six cards into the browser capture that feeds the noscript,
        // and prerender.mjs already writes the full list of twenty there. The
        // page would then list the first six twice.
        console.warn("GitHub unavailable, using the committed snapshot:", error);
        setallRepos(snapshot.repos as GithubRepo[]);
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
        url="https://codewithgabo.com/repositorios"
      />
      <div className='min-h-screen p-4 sm:p-8 md:p-12'>
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
                  <RepoCard
                    name={repo.name}
                    description={repo.description}
                    url={repo.html_url}
                    language={repo.language}
                    stars={repo.stargazers_count}
                    forks={repo.forks_count}
                    updatedAt={repo.updated_at}
                    topics={repo.topics}
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
