import React from "react";
import Fade from "react-reveal/Fade";

import aboutdata from "../assets/about";

const About = () => {
  return (
    <div className='min-h-screen p-12'>
      <div className='container shadow-lg mx-auto bg-green-100 rounded-lg py-12'>
        <Fade bottom duration={2000} distance='40px'>
          <div className='greet-main mb-10'>
            <div className='greeting-main'>
              <div className='greeting-text-div'>
                <div>
                  <h1 className='greeting-text mb-6 ml-6'>{aboutdata.title}</h1>
                  <h2 className='greeting-nickname mt-6 mb-10 ml-6'>
                    {aboutdata.subtitle}
                  </h2>
                  <p className='greeting-text-p text-base mt-6 ml-6'>
                    {aboutdata.first_paragraph}
                  </p>
                  <p className='greeting-text-p subTitle mt-6 ml-6'>
                    {aboutdata.second_paragraph}
                  </p>
                  <p className='greeting-text-p subTitle mt-6 ml-6'>
                    {aboutdata.third_paragraph}
                  </p>
                  <p className='greeting-text-p subTitle mt-6 ml-6'>
                    {aboutdata.fourth_paragraph}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Fade>
      </div>
    </div>
  );
};

export default About;
