
import { Link } from "react-router-dom";
import AnimatedSection from "./common/AnimatedSection";
import SEO from "./common/SEO";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCode,
  faDesktop,
  faMobile,
  faServer,
  faDatabase,
  faCloud,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import usePageTracking from "../hooks/useAnalytics";

const services = [
  {
    icon: faCode,
    title: "Web Development",
    description:
      "Custom web applications built with modern frameworks like React, ensuring responsive and interactive user experiences.",
  },
  {
    icon: faServer,
    title: "Backend Development",
    description:
      "Robust server-side solutions using C# and .NET, creating scalable and secure APIs and services.",
  },
  {
    icon: faMobile,
    title: "Mobile Development",
    description:
      "Cross-platform mobile applications that provide native-like experience using React Native.",
  },
  {
    icon: faDatabase,
    title: "Database Design",
    description:
      "Efficient database architecture and optimization using SQL and NoSQL solutions.",
  },
  {
    icon: faDesktop,
    title: "UI/UX Design",
    description:
      "User-centered design approaches creating intuitive and engaging interfaces.",
  },
  {
    icon: faCloud,
    title: "Cloud Solutions",
    description:
      "Cloud infrastructure setup and management using AWS and Azure services.",
  },
];

const Services = () => {
  usePageTracking();
  
  return (
    <>
      <SEO
        title="Services - Full Stack Development"
        description="Professional web development services including React development, backend solutions with C# and .NET, mobile applications, and cloud infrastructure."
        keywords="web development services, React developer for hire, full stack services, C# development, cloud solutions"
        url="https://codewithgabo.com/#/services"
      />
      <div className='min-h-screen p-12 bg-background'>
        <div className='container mx-auto'>
          <AnimatedSection variant="fadeInUp" duration={0.6}>
            <section className='services-container'>
              <header className='services-header'>
                <h1 className='services-title'>My Services</h1>
                <p className='services-subtitle'>
                  Comprehensive solutions for your digital needs
                </p>
              </header>

              <div className='services-grid' role="list">
                {services.map((service, index) => (
                  <AnimatedSection
                    key={index}
                    variant="fadeInUp"
                    duration={0.5}
                    delay={index * 0.1}>
                    <article className='service-card' role="listitem">
                      <div className='service-icon' aria-hidden="true">
                        <FontAwesomeIcon icon={service.icon} />
                      </div>
                      <h3 className='service-title'>{service.title}</h3>
                      <p className='service-description'>{service.description}</p>
                    </article>
                  </AnimatedSection>
                ))}
              </div>

              <AnimatedSection variant="scaleIn" duration={0.6} delay={0.5}>
                <aside className='cta-container'>
                  <div className='cta-content'>
                    <h2 className='cta-title'>Let's Work Together</h2>
                    <p className='cta-description'>
                      Have a project in mind? Let's discuss how I can help bring
                      your ideas to life.
                    </p>
                    <nav className='cta-buttons' aria-label="Call to action">
                      <Link 
                        to='/gabriel-abreu' 
                        className='cta-button primary'
                        aria-label="Contact Gabriel Abreu">
                        Let's Talk
                        <FontAwesomeIcon
                          icon={faArrowRight}
                          className='button-icon'
                          aria-hidden="true"
                        />
                      </Link>
                      <a
                        href='mailto:fco.g.abreu@gmail.com'
                        className='cta-button secondary'
                        aria-label="Send email to Gabriel Abreu">
                        Email Me
                      </a>
                    </nav>
                  </div>
                </aside>
              </AnimatedSection>
            </section>
          </AnimatedSection>
        </div>
      </div>
    </>
  );
};

export default Services;
