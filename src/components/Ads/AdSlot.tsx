import { useEffect, useRef } from 'react';
import './AdSlot.css';

/**
 * Conditional Google AdSense slot.
 *
 * Renders nothing when VITE_ADSENSE_CLIENT_ID is not configured, so the
 * component is safe to embed throughout the app before AdSense is
 * approved or activated.
 *
 * Once VITE_ADSENSE_CLIENT_ID is set in env (and the AdSense script is
 * loaded by index.html — wired conditionally there), this component
 * renders the standard <ins class="adsbygoogle"> markup and pushes
 * the slot into AdSense's queue on mount.
 *
 * Usage:
 *   <AdSlot slotId="1234567890" />
 *   <AdSlot slotId="9876543210" format="rectangle" />
 *
 * `slotId` is the per-slot ID you create inside AdSense → Ads → By ad
 * unit. Each placement on the site should have its own unique slot id
 * so AdSense can A/B and report independently.
 */

interface Props {
  slotId: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  layout?: string;
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    // AdSense's queue. AdSense's script polls this and renders ads.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adsbygoogle?: any[];
  }
}

export default function AdSlot({
  slotId,
  format = 'auto',
  layout,
  responsive = true,
  className = '',
  style,
}: Props) {
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!clientId) return;
    // Push the slot into AdSense's render queue. Wrapped in try/catch
    // because in development / hot-reload the queue can already have
    // an entry for this slot, which AdSense throws on.
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.warn('[AdSlot] adsbygoogle push failed:', err);
    }
  }, [clientId, slotId]);

  if (!clientId) return null;

  return (
    <div className={`ad-slot ${className}`.trim()} aria-hidden="true">
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        {...(layout ? { 'data-ad-layout': layout } : {})}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
