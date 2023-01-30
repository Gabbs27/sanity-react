import React from "react";
import Card from "./card/Card";
import { data } from "../assets/data"; // double check the path here

const Portfolio = () => {
  if (!data) return <div>Loading...</div>; // this will show loading message until data is loaded
  return (
    <div className='min-h-screen p-12'>
      <div className='container mx-auto'>
        <h2 className='text-3xl flex justify-center'>Portfolio</h2>
        <h3 className='text-lg text-gray-600 flex justify-center mb-12'>
          My projects!
        </h3>
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
    </div>
  );
};

export default Portfolio;
