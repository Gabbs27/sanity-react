import React from "react";
import Fade from "react-reveal/Fade";
import NotFoundCard from "./card/NotFoundCard";

export default function NotFound() {
  return (
    <div className='min-h-screen p-12'>
      <div className='container'>
        <Fade bottom duration={2000} distance='40px'>
          <div className='greet-main mb-10'>
            <div className='greeting-main'>
              <div className='greeting-text-div'>
                <NotFoundCard
                  name='Not Found'
                  description="Definitely Something's wrong"
                  image=''
                  title="Something's wrong"
                />
              </div>
            </div>
          </div>
        </Fade>
      </div>
    </div>
  );
}
