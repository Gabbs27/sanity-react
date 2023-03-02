import React from "react";
import Fade from "react-reveal/Fade";
import p from "../assets/p-red.png";
import PresentationCard from "./card/MeCard";
import medata from "../assets/gabriel";

const Me = () => {
  return (
    <div className='min-h-screen p-12'>
      <div className='container py-10'>
        <Fade bottom duration={2000} distance='40px'>
          <div className='greet-main mb-10'>
            <div className='greeting-main'>
              <div className='greeting-text-div'>
                <PresentationCard
                  name={medata.title}
                  description={medata.description}
                  image={p}
                  title={medata.subtitle}
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
