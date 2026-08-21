import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Page-view tracking for the SPA.
 *
 * Sends straight through the gtag instance that index.html already loads,
 * rather than initialising a second analytics client.
 *
 * This used to run on react-ga4 with its own measurement ID from
 * VITE_GA_TRACKING_ID, which pointed at a different GA4 property than the tag
 * in index.html. The Google tag was also configured to fan out to both
 * properties, so one of them received the landing page up to three times — once
 * from the fan-out, once from ReactGA.initialize (which calls gtag config, and
 * that sends a page_view of its own), and once from the explicit send — while
 * the other property never saw a single client-side navigation. Neither set of
 * numbers meant anything.
 *
 * One property, one client, one page_view per view.
 *
 * The effect keys off the location rather than running once per mount. It used
 * to have an empty dependency array, which quietly broke post-to-post
 * navigation: /:slug renders one <OnePost /> with no key, so moving from one
 * post to another reuses the mounted component, the effect never re-ran, and
 * the second post was never counted. That is exactly the path the "Sigue
 * leyendo" block creates, so the feature meant to raise pages-per-session was
 * invisible to the property measuring it.
 *
 * page_location carries the full href on purpose: GA4 reads utm_source,
 * utm_medium and utm_campaign out of that field, so campaign attribution for
 * anyone arriving from a tagged link depends on the query string being here.
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
  }
}

// The last URL reported. OnePost returns <NotFound /> for an unknown slug and
// both components call this hook, so an unresolved slug used to count twice.
let lastTracked: string | null = null;

export const usePageTracking = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;

    const url = window.location.href;
    if (url === lastTracked) return;
    lastTracked = url;

    window.gtag("event", "page_view", {
      page_path: pathname + search,
      page_location: url,
      page_title: document.title,
    });
  }, [pathname, search]);
};

export default usePageTracking;
