
import "./Greeting.css";
import AnimatedSection from "../common/AnimatedSection";
import p from "../../assets/nobggabo.png";

const Greeting = () => {
  return (
    <AnimatedSection variant="fadeInUp" duration={0.8}>
      <section className='greet-main mb-10' aria-labelledby="greeting-heading">
        <div className='greeting-main'>
          <div className='greeting-text-div'>
            <div>
              <h1 id="greeting-heading" className='greeting-text mb-6'>Gabriel Abreu</h1>
              <h2 className='greeting-nickname mb-6' aria-label="Also known as Gabbs279">
                ( Gabbs279)
              </h2>
              <p className='greeting-text-p'>
                A driven individual who strives to develop sustainable, scalable
                solutions for both social and technical systems, always seeking
                to create a lasting impact.
              </p>
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
