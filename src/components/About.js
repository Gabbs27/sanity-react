import React from "react";
import Fade from "react-reveal/Fade";
import p from "../assets/p-red.png";

const About = () => {
  return (
    <div className='min-h-screen p-12'>
      <div className='container mx-auto'>
        <Fade bottom duration={2000} distance='40px'>
          <div className='greet-main mb-10'>
            <div className='greeting-main'>
              <div className='greeting-text-div'>
                <div>
                  <h1 className='greeting-text mb-6'>About Code with Gabo</h1>
                  <h2 className='greeting-nickname mb-6'>By Gabbs279</h2>
                  <p className='greeting-text-p text-base mt-6'>
                    Our goal at Code with Gabo is to bridge the gap between
                    those who are intimidated by technology and the exciting
                    world of coding. We understand that starting in this field
                    can be challenging, which is why we are here to provide
                    support and guidance.
                  </p>
                  <p className='greeting-text-p subTitle mt-6'>
                    Our platform is designed to be inclusive and empowering,
                    offering quality education and practical advice to help you
                    reach your goals. We believe that everyone should have
                    access to the resources they need to succeed in the world of
                    technology, regardless of their background or experience
                    level.
                  </p>
                  <p className='greeting-text-p subTitle mt-6'>
                    At Code with Gabo, we are passionate about coding and the
                    positive impact it can have on people's lives. That's why we
                    are dedicated to sharing our knowledge and experience with
                    those who are eager to learn. By fostering a supportive and
                    collaborative community, we believe that together, we can
                    achieve great things.
                  </p>
                  <p className='greeting-text-p subTitle mt-6'>
                    So, if you are ready to embark on your coding journey, join
                    us at Code with Gabo. Let's learn, grow, and make a
                    difference together.
                  </p>
                </div>
              </div>
              {/* <div className='greeting-image-div ml-20'>
                <img
                  className=''
                  src={p}
                  alt='professional work collection illustration'
                  style={{ width: "80%" }}
                />
              </div> */}
            </div>
          </div>
        </Fade>
      </div>
    </div>
  );
};

export default About;
