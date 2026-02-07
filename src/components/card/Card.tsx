
import "./Card.css";

interface CardProps {
  id?: number;
  url: string;
  image: string;
  title: string;
  description: string;
  languages: string[];
  badge?: string;
}

const Card = ({ url, image, title, description, languages, badge }: CardProps) => {
  // Detectar si la URL es interna (empieza con / o #)
  const isInternalLink = url.startsWith("/") || url.startsWith("#");

  return (
    <article className='project-card'>
      {badge && <div className='card-badge'>{badge}</div>}
      
      <div className='card-image-container'>
        <img
          src={image}
          alt={title}
          className='card-image'
        />
        <div className='card-overlay'>
          <a
            href={url}
            className='view-project'
            target={isInternalLink ? '_self' : '_blank'}
            rel={isInternalLink ? undefined : 'noopener noreferrer'}>
            {isInternalLink ? 'View Demo' : 'View Project'}
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
