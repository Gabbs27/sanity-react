
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import "./PostCard.css";

const PostCard = ({ post }) => {
  return (
    <article className='post-card'>
      {post.mainImage && (
        <div className='post-image-container'>
          <img
            src={post.mainImage.asset.url}
            alt={post.title}
            className='post-image'
          />
        </div>
      )}
      <div className='post-content'>
        <h2 className='post-title'>{post.title}</h2>
        <p className='post-excerpt'>
          {post.excerpt || "Click to read more about this post..."}
        </p>
        <div className='post-meta'>
          <span className='post-date'>
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <Link to={"/post/" + post.slug.current} className='read-more'>
            Read More <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
