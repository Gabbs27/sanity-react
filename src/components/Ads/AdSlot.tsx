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

// How long to wait for AdSense's verdict after it reports the element done.
// Only spent once AdSense has finished processing, so it is not a guess about
// whether AdSense is still working — it is a bound on how late a verdict that
// may never come is allowed to arrive.
const VERDICT_GRACE_MS = 3000;

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
    // asynchronously from its own queue, so the attributes are the only way to
    // tell "filled" from "unfilled" from "never processed".
    //
    // AdSense writes two different attributes and they do not always both
    // arrive. data-adsbygoogle-status="done" means it has finished processing
    // the element. data-ad-status is the verdict, "filled" or "unfilled".
    //
    // In production the end-of-post unit reaches done WITHOUT ever getting a
    // verdict: status done, data-ad-status null, zero iframes. Watching only
    // for the verdict left that slot in "pending" permanently, so a 303px
    // empty box labelled "Advertisement" sat at the foot of every post.
    //
    // A previous version had the opposite bug: it invented "no-response" 3s
    // after mount regardless of what AdSense was doing, hiding the container
    // while AdSense was still measuring it — and an ad cannot be placed into a
    // zero-width hidden box, so the guess made itself come true. The grace
    // period below only starts once AdSense itself reports done, and the
    // observer stays attached afterwards, so a late verdict still wins.
    let grace: ReturnType<typeof setTimeout> | undefined;

    const read = () => {
      const verdict = ins.getAttribute('data-ad-status');
      if (verdict) {
        clearTimeout(grace);
        setStatus(verdict);
        return;
      }
      if (ins.getAttribute('data-adsbygoogle-status') === 'done' && grace === undefined) {
        grace = setTimeout(() => {
          if (!ins.getAttribute('data-ad-status')) setStatus('no-fill');
        }, VERDICT_GRACE_MS);
      }
    };

    const observer = new MutationObserver(read);
    observer.observe(ins, {
      attributes: true,
      attributeFilter: ['data-ad-status', 'data-adsbygoogle-status'],
    });
    // AdSense may have stamped the element before the observer attached; a
    // MutationObserver only reports changes made after observe().
    read();

    return () => {
      observer.disconnect();
      clearTimeout(grace);
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
