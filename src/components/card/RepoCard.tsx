import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import {
  faStar,
  faCodeBranch,
  faClock,
  faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import "./RepoCard.css";

interface RepoCardProps {
  name: string;
  description: string | null;
  url: string;
  language: string | null;
  stars: number;
  forks: number;
  updatedAt: string;
  topics?: string[];
}

// GitHub-style language colors (subset of the ones GitHub uses)
const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Shell: "#89e051",
  Go: "#00ADD8",
  Rust: "#dea584",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Dockerfile: "#384d54",
};

const formatRelative = (dateString: string) => {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
};

export default function RepoCard({
  name,
  description,
  url,
  language,
  stars,
  forks,
  updatedAt,
  topics = [],
}: RepoCardProps) {
  const langColor = language ? LANG_COLORS[language] || "#94A3B8" : "#94A3B8";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="repo-card"
      aria-label={`Open ${name} on GitHub`}>
      <header className="repo-card__header">
        <FontAwesomeIcon icon={faGithub} className="repo-card__github-icon" />
        <h3 className="repo-card__name">{name}</h3>
        <FontAwesomeIcon
          icon={faArrowUpRightFromSquare}
          className="repo-card__external"
          aria-hidden="true"
        />
      </header>

      <p className="repo-card__description">
        {description || <span className="repo-card__no-desc">No description</span>}
      </p>

      {topics.length > 0 && (
        <div className="repo-card__topics">
          {topics.slice(0, 3).map((topic) => (
            <span key={topic} className="repo-card__topic">
              {topic}
            </span>
          ))}
        </div>
      )}

      <footer className="repo-card__footer">
        {language && (
          <span className="repo-card__meta">
            <span
              className="repo-card__lang-dot"
              style={{ backgroundColor: langColor }}
              aria-hidden="true"
            />
            {language}
          </span>
        )}
        <span className="repo-card__meta" title={`${stars} stars`}>
          <FontAwesomeIcon icon={faStar} aria-hidden="true" />
          {stars}
        </span>
        <span className="repo-card__meta" title={`${forks} forks`}>
          <FontAwesomeIcon icon={faCodeBranch} aria-hidden="true" />
          {forks}
        </span>
        <span className="repo-card__meta" title={new Date(updatedAt).toLocaleDateString()}>
          <FontAwesomeIcon icon={faClock} aria-hidden="true" />
          {formatRelative(updatedAt)}
        </span>
      </footer>
    </a>
  );
}
