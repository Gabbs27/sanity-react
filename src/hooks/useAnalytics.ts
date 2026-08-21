import { useEffect } from "react";

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
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
  }
}

export const usePageTracking = () => {
  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_path: window.location.pathname + window.location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, []);
};

export default usePageTracking;
