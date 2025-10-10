import { useEffect } from "react";
import ReactGA from "react-ga";

let isInitialized = false;

export const initializeAnalytics = () => {
  if (!isInitialized && process.env.REACT_APP_GA_TRACKING_ID) {
    ReactGA.initialize(process.env.REACT_APP_GA_TRACKING_ID);
    isInitialized = true;
  }
};

export const usePageTracking = () => {
  useEffect(() => {
    initializeAnalytics();
    ReactGA.pageview(window.location.pathname + window.location.search);
  }, []);
};

export default usePageTracking;

