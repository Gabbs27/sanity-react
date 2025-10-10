import React from "react";
import AnimatedSection from "./common/AnimatedSection";
import SEO from "./common/SEO";
import aboutdata from "../assets/about";
import usePageTracking from "../hooks/useAnalytics";

const About = () => {
  usePageTracking();
  return (
    <>
      <SEO
        title="About Me"
        description="Learn more about Gabriel Abreu, a passionate Full Stack Developer with expertise in React, C#, and modern web technologies."
        keywords="About Gabriel Abreu, developer bio, full stack developer background"
        url="http://codewithgabo.com/#/About"
      />
      <div className='min-h-screen p-12 bg-background'>
        <div className='container mx-auto'>
          <AnimatedSection variant="fadeInUp" duration={0.6}>
            <article className='about-container'>
              <header className='about-header'>
                <h1 className='about-title'>{aboutdata.title}</h1>
                <h2 className='about-subtitle'>{aboutdata.subtitle}</h2>
              </header>

              <div className='about-content'>
                <AnimatedSection variant="fadeInUp" delay={0.2}>
                  <p className='about-paragraph'>{aboutdata.first_paragraph}</p>
                </AnimatedSection>
                <AnimatedSection variant="fadeInUp" delay={0.3}>
                  <p className='about-paragraph'>{aboutdata.second_paragraph}</p>
                </AnimatedSection>
                <AnimatedSection variant="fadeInUp" delay={0.4}>
                  <p className='about-paragraph'>{aboutdata.third_paragraph}</p>
                </AnimatedSection>
                <AnimatedSection variant="fadeInUp" delay={0.5}>
                  <p className='about-paragraph'>{aboutdata.fourth_paragraph}</p>
                </AnimatedSection>
              </div>
            </article>
          </AnimatedSection>
        </div>
      </div>
    </>
  );
};

export default About;
