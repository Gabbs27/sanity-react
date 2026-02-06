import { useEffect, useState } from "react";
import Card from "./card/Card";
import AnimatedSection from "./common/AnimatedSection";
import SEO from "./common/SEO";
import { data } from "../assets/data";
import usePageTracking from "../hooks/useAnalytics";
import Greeting from "./Greeting/Greeting";

const Portfolio = () => {
  usePageTracking();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    setFilteredData(
      data.filter((item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm]);

  return (
    <>
      <SEO
        title="Portfolio - Projects & Work"
        description="Explore Gabriel Abreu's portfolio featuring modern web applications built with React, TypeScript, and cutting-edge technologies."
        keywords="React projects, web development portfolio, TypeScript applications, full stack projects"
        url="http://codewithgabo.com/#/portfolio"
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
                />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Portfolio;
