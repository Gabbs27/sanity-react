import React from "react";
import Card from "./card/Card";
import Fade from "react-reveal/Fade";
import { data } from "../assets/data";

import Greeting from "./Greeting/Greeting";

const Portfolio = () => {
  if (!data) return <div>Loading...</div>;
  return (
    <div className='min-h-screen p-12'>
      <div className='container mx-auto'>
        <Greeting />

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {data.map((item) => {
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
      </div>
    </div>
  );
};

export default Portfolio;
