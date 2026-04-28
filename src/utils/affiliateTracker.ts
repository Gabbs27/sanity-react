import { isAffiliate } from '../config/affiliates';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GtagFn = (...args: any[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
  }
}

/**
 * Find the nearest ancestor <a> for a given DOM node, or null.
 * Implemented as a small loop instead of `closest('a')` to keep
 * behaviour predictable on shadow-DOM-free pages.
 */
function findAnchor(node: EventTarget | null): HTMLAnchorElement | null {
  let el: Node | null = node as Node | null;
  while (el && el.nodeType === 1) {
    if ((el as HTMLElement).tagName === 'A') {
      return el as HTMLAnchorElement;
    }
    el = (el as HTMLElement).parentElement;
  }
  return null;
}

/**
 * Install a single delegated click listener that fires a GA4
 * `affiliate_click` event whenever an anchor pointing at one of the
 * allowlisted hostnames is activated.
 *
 * Returns an `uninstall` function so tests / hot-reload can clean up.
 */
export function installAffiliateTracker(): () => void {
  const handler = (e: MouseEvent) => {
    // Ignore non-primary clicks (middle/right) and modifier-augmented
    // clicks — those are already handled by the browser as new-tab
    // navigations and we still want them tracked, so DON'T return here.
    const a = findAnchor(e.target);
    if (!a || !a.href) return;

    let url: URL;
    try {
      url = new URL(a.href);
    } catch {
      return; // mailto:, javascript:, etc.
    }

    if (!isAffiliate(url.hostname)) return;

    const gtag = window.gtag;
    if (typeof gtag !== 'function') return;

    gtag('event', 'affiliate_click', {
      link_domain: url.hostname,
      link_url: a.href,
      link_text: (a.textContent || '').trim().slice(0, 80),
      // Default outbound flag mirrors GA4's built-in click event so
      // GA's automatic enhanced-measurement reports stay consistent.
      outbound: true,
    });
  };

  document.addEventListener('click', handler, { capture: true });
  return () => document.removeEventListener('click', handler, { capture: true });
}
