import React from "react";
import "./Card.css";

const Card = ({ id, url, image, title, description, languages }) => {
  return (
    <article className='project-card'>
      <div className='card-image-container'>
        <img
          src={process.env.PUBLIC_URL + image}
          alt={title}
          className='card-image'
        />
        <div className='card-overlay'>
          <a
            href={url}
            className='view-project'
            target='_blank'
            rel='noopener noreferrer'>
            View Project
          </a>
        </div>
      </div>

      <div className='card-content'>
        <h3 className='card-title'>{title}</h3>
        <p className='card-description'>{description}</p>

        <div className='card-tags'>
          {languages.map((language, index) => (
            <span key={index} className='tag'>
              {language}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
};

export default Card;
