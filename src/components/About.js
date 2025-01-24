import React from "react";
import Fade from "react-reveal/Fade";
import aboutdata from "../assets/about";
import ReactGA from "react-ga";

ReactGA.initialize("G-76H28FJYRY");
ReactGA.pageview(window.location.pathname + window.location.search);

const About = () => {
  return (
    <div className='min-h-screen p-12 bg-background'>
      <div className='container mx-auto'>
        <Fade bottom duration={2000} distance='40px'>
          <div className='about-container'>
            <div className='about-header'>
              <h1 className='about-title'>{aboutdata.title}</h1>
              <h2 className='about-subtitle'>{aboutdata.subtitle}</h2>
            </div>

            <div className='about-content'>
              <p className='about-paragraph'>{aboutdata.first_paragraph}</p>
              <p className='about-paragraph'>{aboutdata.second_paragraph}</p>
              <p className='about-paragraph'>{aboutdata.third_paragraph}</p>
              <p className='about-paragraph'>{aboutdata.fourth_paragraph}</p>
            </div>
          </div>
        </Fade>
      </div>
    </div>
  );
};

export default About;
