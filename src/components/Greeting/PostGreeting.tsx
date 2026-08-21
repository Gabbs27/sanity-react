
import "./Greeting.css";
import AnimatedSection from "../common/AnimatedSection";
import p from "../../assets/nobggabo.webp";

const PostGreeting = () => {
  return (
    <AnimatedSection variant="fadeInUp" duration={0.8}>
      <section className='greet-main mb-10' aria-labelledby="blog-heading">
        <div className='greeting-main'>
          <div className='greeting-text-div'>
            <div>
              <h1 id="blog-heading" className='greeting-text mb-6'>All Posts</h1>
              <h2 className='greeting-nickname mb-6'>Code With Gabo</h2>
              <p className='greeting-text-p mt-4'>
                Notes from what I&rsquo;m building: React, TypeScript, and what
                breaks along the way. In English and Spanish.
              </p>
            </div>
          </div>
          <div className='greeting-image-div ml-20'>
            <img
              className=''
              src={p}
              alt='Blog illustration showing code and development'
              style={{ width: "80%" }}
            />
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
};

export default PostGreeting;
