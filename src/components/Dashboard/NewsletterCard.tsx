import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';

interface Stats {
  total: number;
  weeklyDelta: number;
}

export default function NewsletterCard() {
  const { adminToken } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminToken) return;
    const apiUrl = import.meta.env.VITE_ANALYTICS_API_URL || '';
    fetch(`${apiUrl}/api/newsletter/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)))
      .then(setStats)
      .catch((e) => setError(String(e)));
  }, [adminToken]);

  return (
    <div className="metric-card metric-card--newsletter">
      <div className="metric-card__icon">
        <FontAwesomeIcon icon={faEnvelope} />
      </div>
      <div className="metric-card__body">
        <div className="metric-card__label">Newsletter</div>
        {error ? (
          <div className="metric-card__value metric-card__value--small">N/A</div>
        ) : stats ? (
          <>
            <div className="metric-card__value">{stats.total.toLocaleString()}</div>
            <div className="metric-card__sublabel">
              {stats.weeklyDelta > 0 ? `+${stats.weeklyDelta} esta semana` : 'Sin nuevos esta semana'}
            </div>
          </>
        ) : (
          <div className="metric-card__value metric-card__value--small">…</div>
        )}
      </div>
    </div>
  );
}
