import React from "react";
import Fade from "react-reveal/Fade";
import NotFoundCard from "./card/NotFoundCard";
import ReactGA from "react-ga";
ReactGA.initialize("G-76H28FJYRY");
ReactGA.pageview(window.location.pathname + window.location.search);

export default function NotFound() {
  return (
    <div className='min-h-screen p-12 '>
      <div className='container py-10'>
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
