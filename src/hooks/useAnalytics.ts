import { useEffect } from "react";
import ReactGA from "react-ga4";

let isInitialized = false;

export const initializeAnalytics = () => {
  if (!isInitialized && import.meta.env.VITE_GA_TRACKING_ID) {
    ReactGA.initialize(import.meta.env.VITE_GA_TRACKING_ID);
    isInitialized = true;
  }
};

export const usePageTracking = () => {
  useEffect(() => {
    initializeAnalytics();
    ReactGA.send({ hitType: "pageview", page: window.location.pathname + window.location.search });
  }, []);
};

export default usePageTracking;
