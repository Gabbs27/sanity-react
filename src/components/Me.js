import React from "react";
import Fade from "react-reveal/Fade";
import p from "../assets/p-red.png";
import PresentationCard from "./card/MeCard";

const Me = () => {
  return (
    <div className='min-h-screen p-12'>
      <div className='container'>
        <Fade bottom duration={2000} distance='40px'>
          <div className='greet-main mb-10'>
            <div className='greeting-main'>
              <div className='greeting-text-div'>
                <PresentationCard
                  name={"Francisco Gabriel Abreu Cornelio"}
                  description={
                    "I'm a Full Stack Software Developer with 5+ years of applicable experience in designing and implementing software solutions with ReactJs, C#, and JavaScript, I enjoy working in teams and also can stand alone." +
                    "Motivated by the creation of IT solutions, I always aspire to personal development, both human and professional, improving my qualities daily, learning languages ​​and agile techniques for growth in my area."
                  }
                  image={p}
                  title={
                    "Full Stack Developer (Remote) | ReactJs | C# | JavaScript | Challenge-aholic"
                  }
                />
              </div>
            </div>
          </div>
        </Fade>
      </div>
    </div>
  );
};

export default Me;
