import "./PostCard.css";

interface PostCardProps {
  image: string;
  title: string;
  date?: string;
  tags?: string[];
}

const PostCard = ({ image, title, date, tags = [] }: PostCardProps) => {
  return (
    <article className="post-card">
      <div className="post-card__image-container">
        <img
          src={image}
          alt={title}
          className="post-card__image"
          loading="lazy"
        />
        <div className="post-card__overlay">
          <span className="post-card__read-more">Read Article</span>
        </div>
      </div>

      <div className="post-card__content">
        {date && (
          <span className="post-card__date">
            <span className="post-card__date-icon">&#128197;</span>
            {date}
          </span>
        )}
        <h3 className="post-card__title">{title}</h3>

        {tags.length > 0 && (
          <div className="post-card__tags">
            {tags.map((tag, index) => (
              <span key={index} className="post-card__tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};

export default PostCard;
