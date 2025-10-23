import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const GA_MEASUREMENT_ID = "G-JQNRZ40Y4J";

function sendPageView(url: string) {
  if (window.gtag) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
}

export default function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    sendPageView(location.pathname + location.search);
  }, [location]);

  return null;
}
