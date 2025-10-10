import React from "react";
import { Link } from "react-router-dom";
import Fade from "react-reveal/Fade";
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
    <div className='min-h-screen p-12 bg-background'>
      <div className='container mx-auto'>
        <Fade bottom duration={2000} distance='40px'>
          <div className='services-container'>
            <div className='services-header'>
              <h1 className='services-title'>My Services</h1>
              <p className='services-subtitle'>
                Comprehensive solutions for your digital needs
              </p>
            </div>

            <div className='services-grid'>
              {services.map((service, index) => (
                <Fade
                  bottom
                  duration={1000 + index * 200}
                  distance='20px'
                  key={index}>
                  <div className='service-card'>
                    <div className='service-icon'>
                      <FontAwesomeIcon icon={service.icon} />
                    </div>
                    <h3 className='service-title'>{service.title}</h3>
                    <p className='service-description'>{service.description}</p>
                  </div>
                </Fade>
              ))}
            </div>

            <Fade bottom duration={2000} distance='40px'>
              <div className='cta-container'>
                <div className='cta-content'>
                  <h2 className='cta-title'>Let's Work Together</h2>
                  <p className='cta-description'>
                    Have a project in mind? Let's discuss how I can help bring
                    your ideas to life.
                  </p>
                  <div className='cta-buttons'>
                    <Link to='/gabriel-abreu' className='cta-button primary'>
                      Let's Talk
                      <FontAwesomeIcon
                        icon={faArrowRight}
                        className='button-icon'
                      />
                    </Link>
                    <a
                      href='mailto:fco.g.abreu@gmail.com'
                      className='cta-button secondary'>
                      Email Me
                    </a>
                  </div>
                </div>
              </div>
            </Fade>
          </div>
        </Fade>
      </div>
    </div>
  );
};

export default Services;
