import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "./card/Card";
import PostCard from "./card/PostCard";
import AnimatedSection from "./common/AnimatedSection";
import SEO from "./common/SEO";
import NewsletterSignup from "./Newsletter/NewsletterSignup";
import sanityClient from "../client";
import { data } from "../assets/data";
import usePageTracking from "../hooks/useAnalytics";
import Greeting from "./Greeting/Greeting";

interface LatestPost {
  title: string;
  slug: { current: string };
  mainImage?: { asset: { url: string } };
  publishedAt: string;
}

const Portfolio = () => {
  usePageTracking();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState(data);
  const [latestPosts, setLatestPosts] = useState<LatestPost[]>([]);

  useEffect(() => {
    setFilteredData(
      data.filter((item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm]);

  useEffect(() => {
    sanityClient
      .fetch(
        `*[_type=="post" && !(_id in path("drafts.**"))] | order(publishedAt desc)[0...3]{
          title,
          slug,
          mainImage{ asset->{ url } },
          publishedAt
        }`
      )
      .then((data: LatestPost[]) => setLatestPosts(data || []))
      .catch(() => setLatestPosts([]));
  }, []);

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <>
      <SEO
        title="Portfolio - Projects & Work"
        description="Explore Gabriel Abreu's portfolio featuring modern web applications built with React, TypeScript, and cutting-edge technologies."
        keywords="React projects, web development portfolio, TypeScript applications, full stack projects"
        url="https://codewithgabo.com/#/portfolio"
      />
      <div className='min-h-screen p-12'>
        <Greeting />
        <div className='container mx-auto'>
          <AnimatedSection variant="fadeIn" duration={0.6}>
            <div className='search-container mb-12'>
              <input
                type='text'
                placeholder='Search projects...'
                className='input search-input'
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search projects"
              />
            </div>
          </AnimatedSection>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {filteredData.map((project, index) => (
              <AnimatedSection
                key={project.id}
                variant="fadeInUp"
                duration={0.5}
                delay={index * 0.1}>
                <Card
                  image={project.image}
                  title={project.title}
                  description={project.description}
                  url={project.url}
                  languages={project.languages}
                  badge={project.badge}
                />
              </AnimatedSection>
            ))}
          </div>

          {latestPosts.length > 0 && (
            <AnimatedSection variant="fadeIn" duration={0.6}>
              <section className='mt-20'>
                <div className='flex items-end justify-between mb-8 flex-wrap gap-4'>
                  <h2 className='text-3xl md:text-4xl font-bold'>Latest from the blog</h2>
                  <Link
                    to='/allpost'
                    className='underline opacity-80 hover:opacity-100 transition-opacity'
                  >
                    View all posts →
                  </Link>
                </div>
                <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
                  {latestPosts.map((p, i) => (
                    <AnimatedSection
                      key={p.slug.current}
                      variant="fadeInUp"
                      duration={0.5}
                      delay={i * 0.1}
                    >
                      <Link
                        to={`/${p.slug.current}`}
                        className='block no-underline text-inherit'
                      >
                        <PostCard
                          image={p.mainImage?.asset?.url || ""}
                          title={p.title}
                          date={formatDate(p.publishedAt)}
                        />
                      </Link>
                    </AnimatedSection>
                  ))}
                </div>
              </section>
            </AnimatedSection>
          )}

          <AnimatedSection variant="fadeIn" duration={0.6}>
            <section className='mt-20'>
              <NewsletterSignup variant="card" />
            </section>
          </AnimatedSection>
        </div>
      </div>
    </>
  );
};

export default Portfolio;
