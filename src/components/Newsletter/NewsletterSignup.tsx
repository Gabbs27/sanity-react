import { useState, type FormEvent } from 'react';
import './NewsletterSignup.css';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface Props {
  variant?: 'inline' | 'card';
  title?: string;
  description?: string;
}

const apiUrl = import.meta.env.VITE_ANALYTICS_API_URL || '';

export default function NewsletterSignup({
  variant = 'card',
  title = 'Suscríbete al newsletter',
  description = 'Tutoriales, recursos y reflexiones sobre desarrollo. Sin spam — cancelas cuando quieras.',
}: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg(null);
    try {
      const res = await fetch(`${apiUrl}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setStatus('success');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (status === 'success') {
    return (
      <div className={`newsletter newsletter--${variant} newsletter--success`}>
        <p className="newsletter__success">
          ✓ ¡Casi listo! Revisa tu inbox para confirmar la suscripción.
        </p>
      </div>
    );
  }

  return (
    <section className={`newsletter newsletter--${variant}`} aria-labelledby="newsletter-title">
      <h3 id="newsletter-title" className="newsletter__title">{title}</h3>
      <p className="newsletter__description">{description}</p>
      <form onSubmit={handleSubmit} className="newsletter__form" noValidate>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          aria-label="Email"
          className="newsletter__input"
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email}
          className="newsletter__btn">
          {status === 'loading' ? 'Suscribiendo…' : 'Suscribirme'}
        </button>
      </form>
      {status === 'error' && (
        <p className="newsletter__error" role="alert">
          {errorMsg || 'Algo falló. Intenta de nuevo en un momento.'}
        </p>
      )}
    </section>
  );
}
