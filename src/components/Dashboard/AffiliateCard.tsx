import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import './AffiliateCard.css';

interface AffiliateRow {
  domain: string;
  clicks: number;
}

interface Props {
  data?: AffiliateRow[];
}

export default function AffiliateCard({ data = [] }: Props) {
  const top = data.slice(0, 5);
  const totalClicks = data.reduce((s, r) => s + r.clicks, 0);

  return (
    <div className="affiliate-card">
      <header className="affiliate-card__header">
        <FontAwesomeIcon icon={faLink} className="affiliate-card__icon" />
        <div>
          <h3 className="affiliate-card__title">Affiliate clicks</h3>
          <p className="affiliate-card__subtitle">
            {totalClicks > 0
              ? `${totalClicks} total in this range`
              : 'No clicks tracked yet'}
          </p>
        </div>
      </header>
      {top.length === 0 ? (
        <p className="affiliate-card__empty">
          Add affiliate domains to <code>src/config/affiliates.ts</code> and
          register <code>link_domain</code> as a GA4 Custom Dimension.
        </p>
      ) : (
        <ol className="affiliate-card__list">
          {top.map((row) => (
            <li key={row.domain} className="affiliate-card__row">
              <span className="affiliate-card__domain">{row.domain}</span>
              <span className="affiliate-card__count">{row.clicks}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
