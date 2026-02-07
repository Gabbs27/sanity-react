import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AnimatedSection from "./common/AnimatedSection";
import SEO from "./common/SEO";
import sanityClient from "../client";
import PostCard from "./card/PostCard";
import PostGreeting from "./Greeting/PostGreeting";
import usePageTracking from "../hooks/useAnalytics";
import "./card/PostCard.css";

interface SanityPost {
  title: string;
  slug: { current: string };
  mainImage?: { asset: { _id: string; url: string } };
  publishedAt: string;
}

export default function AllPosts() {
  usePageTracking();
  const [allPostsData, setAllPosts] = useState<SanityPost[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const postsPerPage = 6;
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const filteredPosts = allPostsData.filter((post) =>
    post.title.toLowerCase().includes(search.toLowerCase())
  );
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

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

  const formatDate = (dateString: string) => {
    const options = { year: "numeric", month: "long", day: "numeric" } as const;
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <>
      <SEO
        title="Blog - Articles & Tutorials"
        description="Read Gabriel Abreu's blog featuring tutorials, insights, and articles about web development, React, and modern technologies."
        keywords="web development blog, React tutorials, programming articles, tech blog"
        url="https://codewithgabo.com/#/allpost"
      />
      <div className='min-h-screen p-12'>
        <section className='container mx-auto py-12'>
          <PostGreeting />

          <div className="blog-search-container">
            <input
              type='text'
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder='Search posts...'
              className='blog-search'
              aria-label="Search blog posts"
            />
          </div>

          {currentPosts.length > 0 ? (
            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {currentPosts.map((post, index) => (
                <AnimatedSection
                  key={post.slug.current}
                  variant="fadeInUp"
                  duration={0.5}
                  delay={index * 0.1}>
                  <Link
                    to={"/" + post.slug.current}
                    style={{ textDecoration: "none" }}>
                    <PostCard
                      image={post.mainImage?.asset?.url || ""}
                      title={post.title}
                      date={formatDate(post.publishedAt)}
                    />
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          ) : (
            <div className="blog-empty">
              <div className="blog-empty__icon">&#128221;</div>
              <p className="blog-empty__text">
                {search ? "No posts match your search." : "No posts yet."}
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
}
