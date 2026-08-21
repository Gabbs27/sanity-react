import { useEffect, useRef, useState } from 'react';
import { ADSENSE_CLIENT_ID, isValidSlotId } from '../../config/adsense';
import './AdSlot.css';

/**
 * Google AdSense slot.
 *
 * Renders nothing unless `slotId` is a real numeric ad unit ID (see
 * src/config/adsense.ts). That guard replaces the old env-var gate, which
 * failed open in the worst direction: VITE_ADSENSE_CLIENT_ID was never set,
 * so Vite inlined `undefined`, `if (!clientId) return null` became
 * unconditional, and the minifier stripped every <ins> out of the bundle.
 *
 * The page-level adsbygoogle.js script is loaded once in index.html. This
 * component only emits the per-slot markup and pushes it into AdSense's queue.
 *
 * Usage:
 *   <AdSlot slotId={AD_SLOTS.inArticle} format="fluid" layout="in-article" />
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
  const insRef = useRef<HTMLModElement>(null);
  // Which slot id has already been pushed. A boolean would make the slotId
  // dependency below dead: a changed id would re-run the effect and return
  // immediately, so the new unit would never enter AdSense's queue.
  const pushedFor = useRef<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const enabled = isValidSlotId(slotId);

  useEffect(() => {
    if (!enabled) return;
    const ins = insRef.current;
    if (!ins) return;

    // A different unit is a different ad: forget the previous one's fill state
    // so a stale "unfilled" cannot keep the new slot hidden.
    setStatus(null);

    // AdSense stamps data-adsbygoogle-status on elements it has already
    // claimed. Pushing such an element again throws "All ins elements in the
    // DOM with class adsbygoogle already have ads in them".
    if (pushedFor.current !== slotId && !ins.getAttribute('data-adsbygoogle-status')) {
      pushedFor.current = slotId;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[AdSlot] adsbygoogle push failed:', err);
      }
    }

    // The try/catch cannot see the common failures: AdSense reports them
    // asynchronously from its own queue, so data-ad-status is the only way to
    // tell "filled" from "unfilled" from "never processed".
    //
    // Observed rather than sampled once. A single delayed reading would latch
    // whatever was true at that instant, and a slot that filled a moment later
    // would stay in the display:none branch below — serving a real ad inside a
    // hidden container, which is exactly the kind of unviewable impression that
    // gets an AdSense account limited.
    const observer = new MutationObserver(() => {
      const value = ins.getAttribute('data-ad-status');
      if (value) setStatus(value);
    });
    observer.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });

    // Fallback for the case the observer can never catch: the script never
    // touches the element, so the attribute is never written at all.
    const timer = window.setTimeout(() => {
      setStatus((prev) => prev ?? (ins.getAttribute('data-ad-status') || 'no-response'));
    }, 3000);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [enabled, slotId]);

  useEffect(() => {
    if (status && import.meta.env.DEV) {
      console.info(`[AdSlot] slot ${slotId}: ${status}`);
    }
  }, [status, slotId]);

  if (!enabled) return null;

  return (
    <div className={`ad-slot ${className}`.trim()} data-ad-state={status ?? 'pending'}>
      {/* AdSense requires ad labels to read exactly "Advertisement" or
          "Sponsored Links". This replaces an aria-hidden on the wrapper, which
          hid focusable links inside the ad iframe from assistive tech —
          axe rule aria-hidden-focus, WCAG 4.1.2. */}
      <span className="ad-slot__label">Advertisement</span>
      {/* data-full-width-responsive is only meaningful for responsive display
          units; sending it on a fluid in-article unit can distort sizing on
          phones, so it is omitted unless the format is "auto". */}
      <ins
        key={slotId}
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slotId}
        data-ad-format={format}
        {...(layout ? { 'data-ad-layout': layout } : {})}
        {...(format === 'auto'
          ? { 'data-full-width-responsive': responsive ? 'true' : 'false' }
          : {})}
      />
    </div>
  );
}
