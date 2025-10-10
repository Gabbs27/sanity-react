import React, { useEffect, useState } from "react";
import Card from "./card/Card";
import Fade from "react-reveal/Fade";
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
    <main className='min-h-screen p-12'>
      <Greeting />
      <div className='container mx-auto'>
        <div className='search-container mb-12'>
          <input
            type='text'
            placeholder='Search projects...'
            className='input search-input'
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {filteredData.map((project, index) => (
            <Fade bottom duration={1000 + index * 200} distance='40px'>
              <Card
                key={project.id}
                image={project.image}
                title={project.title}
                description={project.description}
                url={project.url}
                languages={project.languages}
              />
            </Fade>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Portfolio;
