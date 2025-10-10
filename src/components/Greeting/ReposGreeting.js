import React from "react";
import "./Greeting.css";
import AnimatedSection from "../common/AnimatedSection";
import p from "../../assets/p-red.png";

const ReposGreeting = () => {
  return (
    <AnimatedSection variant="fadeInUp" duration={0.8}>
      <section className='greet-main mb-10' aria-labelledby="repos-heading">
        <div className='greeting-main'>
          <div className='greeting-text-div'>
            <div>
              <h1 id="repos-heading" className='greeting-text mb-6'>Repositories</h1>
              <h2 className='greeting-nickname mb-6' aria-label="Also known as Gabbs279">
                (Gabbs279)
              </h2>
              <p className='greeting-text-p subTitle mt-'>
                Explore my public GitHub repositories that showcase my diverse
                development skills across various projects, from web development
                to innovative solutions. Get a glimpse of my expertise in
                software development and see the breadth of my work.
              </p>
            </div>
          </div>
          <div className='greeting-image-div ml-20'>
            <img
              className=''
              src={p}
              alt='GitHub repositories illustration'
              style={{ width: "80%" }}
            />
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
};

export default ReposGreeting;
