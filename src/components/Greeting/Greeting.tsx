
import { Link } from "react-router-dom";
import "./Greeting.css";
import AnimatedSection from "../common/AnimatedSection";
import p from "../../assets/nobggabo.webp";

const Greeting = () => {
  return (
    <AnimatedSection variant="fadeInUp" duration={0.8}>
      <section className='greet-main mb-10' aria-labelledby="greeting-heading">
        <div className='greeting-main'>
          <div className='greeting-text-div'>
            <div>
              <h1 id="greeting-heading" className='greeting-text mb-6'>Gabriel Abreu</h1>
              <h2 className='greeting-nickname mb-6'>
                Full-Stack Developer &middot; Santo Domingo, RD
              </h2>
              <p className='greeting-text-p'>
                I build web products for small businesses &mdash; a WhatsApp
                ordering platform for Dominican SMEs, a booking site for a
                clinic. React, TypeScript, Next.js. Backend work in C# and .NET.
              </p>
              <p className='greeting-text-p mt-4'>
                I write about how I build them{" "}
                <Link to='/allpost' className='greeting-inline-link'>
                  here
                </Link>
                , including the parts that break.
              </p>
              <div className='greeting-cta'>
                <Link to='/services' className='greeting-cta__primary'>
                  Work with me
                </Link>
                <Link to='/allpost' className='greeting-cta__secondary'>
                  Read the blog
                </Link>
              </div>
            </div>
          </div>
          <div className='greeting-image-div ml-20'>
            <img
              className=''
              src={p}
              alt='Gabriel Abreu professional work illustration'
              style={{ width: "80%" }}
            />
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
};

export default Greeting;
