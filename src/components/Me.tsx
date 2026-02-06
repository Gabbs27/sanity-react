
import AnimatedSection from "./common/AnimatedSection";
import SEO from "./common/SEO";
import p from "../assets/p-red.png";
import medata from "../assets/gabriel";
import usePageTracking from "../hooks/useAnalytics";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";

const Me = () => {
  usePageTracking();
  return (
    <>
      <SEO
        title="Contact - Get in Touch"
        description="Get in touch with Gabriel Abreu for web development projects, collaborations, or job opportunities."
        keywords="contact Gabriel Abreu, hire developer, web development services, collaboration"
        url="http://codewithgabo.com/#/Gabriel-Abreu"
      />
      <div className='min-h-screen p-12 bg-background'>
        <div className='container mx-auto'>
          <AnimatedSection variant="fadeInUp" duration={0.6}>
            <article className='contact-container'>
            <header className='contact-header'>
              <div className='contact-image-wrapper'>
                <img src={p} alt={`${medata.title} - Profile`} className='contact-image' />
              </div>
              <h1 className='contact-name'>{medata.title}</h1>
              <h2 className='contact-subtitle'>{medata.subtitle}</h2>
            </header>

            <div className='contact-content'>
              <p className='contact-description'>{medata.description}</p>

              <nav className='contact-links' aria-label="Contact methods">
                <a
                  href='mailto:fco.g.abreu@gmail.com'
                  className='contact-link email'
                  aria-label="Send email to Gabriel Abreu">
                  <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
                  <span>Email Me</span>
                </a>

                <a
                  href='https://github.com/Gabbs27'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='contact-link github'
                  aria-label="Visit Gabriel Abreu's GitHub profile">
                  <FontAwesomeIcon icon={faGithub} aria-hidden="true" />
                  <span>GitHub</span>
                </a>

                <a
                  href='https://www.linkedin.com/in/francisco-gabriel-abreu-cornelio/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='contact-link linkedin'
                  aria-label="Visit Gabriel Abreu's LinkedIn profile">
                  <FontAwesomeIcon icon={faLinkedin} aria-hidden="true" />
                  <span>LinkedIn</span>
                </a>
                <a
                  href={medata.resumeUrl}
                  download='GabrielAbreu_Resume_2025.pdf'
                  className='contact-link resume'
                  aria-label="Download Gabriel Abreu's resume">
                  <FontAwesomeIcon icon={faFilePdf} aria-hidden="true" />
                  <span>Download CV</span>
                </a>
              </nav>
            </div>
          </article>
        </AnimatedSection>
      </div>
    </div>
    </>
  );
};

export default Me;
