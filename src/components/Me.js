import React from "react";
import Fade from "react-reveal/Fade";
import p from "../assets/p-red.png";
import medata from "../assets/gabriel";
import usePageTracking from "../hooks/useAnalytics";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";

const Me = () => {
  usePageTracking();
  return (
    <div className='min-h-screen p-12 bg-background'>
      <div className='container mx-auto'>
        <Fade bottom duration={2000} distance='40px'>
          <div className='contact-container'>
            <div className='contact-header'>
              <div className='contact-image-wrapper'>
                <img src={p} alt='profile' className='contact-image' />
              </div>
              <h1 className='contact-name'>{medata.title}</h1>
              <h2 className='contact-title'>{medata.subtitle}</h2>
            </div>

            <div className='contact-content'>
              <p className='contact-description'>{medata.description}</p>

              <div className='contact-links'>
                <a
                  href='mailto:fco.g.abreu@gmail.com'
                  className='contact-link email'>
                  <FontAwesomeIcon icon={faEnvelope} />
                  <span>Email Me</span>
                </a>

                <a
                  href='https://github.com/Gabbs27'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='contact-link github'>
                  <FontAwesomeIcon icon={faGithub} />
                  <span>GitHub</span>
                </a>

                <a
                  href='https://www.linkedin.com/in/francisco-gabriel-abreu-cornelio/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='contact-link linkedin'>
                  <FontAwesomeIcon icon={faLinkedin} />
                  <span>LinkedIn</span>
                </a>
                <a
                  href={process.env.PUBLIC_URL + medata.resumeUrl}
                  download='GabrielAbreu_Resume_2025.pdf'
                  className='contact-link resume'>
                  <FontAwesomeIcon icon={faFilePdf} />
                  <span>Download CV</span>
                </a>
              </div>
            </div>
          </div>
        </Fade>
      </div>
    </div>
  );
};

export default Me;
