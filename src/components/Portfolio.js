import React from "react";
import Card from "./card/Card";
import { data } from "../assets/data"; // double check the path here

const Portfolio = () => {
  if (!data) return <div>Loading...</div>; // this will show loading message until data is loaded
  return (
    <div>
      <h1 className='text-center text-3xl font-medium'>My Portfolio</h1>

      <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
        {data.map((item) => {
          return (
            <Card
              key={item.id}
              image={item.image}
              title={item.title}
              description={item.description}
              url={item.url}
              languages={item.languages}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Portfolio;
