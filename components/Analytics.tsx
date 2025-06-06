"use client";

import { useEffect, useState } from "react";

// Replace with your actual Google Analytics ID
const GA_TRACKING_ID = "G-XXXXXXXXXX";

export default function Analytics() {
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for existing consent
    const savedConsent = localStorage.getItem("analytics-consent");
    if (savedConsent) {
      setConsentGiven(savedConsent === "true");
    }
  }, []);

  const handleConsent = (consent: boolean) => {
    localStorage.setItem("analytics-consent", consent.toString());
    setConsentGiven(consent);

    if (consent) {
      // Load analytics only after consent
      const script = document.createElement("script");
      script.src =
        "https://www.googletagmanager.com/gtag/js?id=" + GA_TRACKING_ID;
      script.async = true;
      document.body.appendChild(script);

      // Initialize the dataLayer array
      window.dataLayer = window.dataLayer || [];

      // Define the gtag function
      const gtag = function (...args: any[]) {
        // @ts-ignore - TS doesn't know about dataLayer
        window.dataLayer.push(arguments);
      };

      // Initialize gtag with your tracking ID
      gtag("js", new Date());
      gtag("config", GA_TRACKING_ID, {
        page_path: window.location.pathname,
        transport_type: "beacon",
        anonymize_ip: true,
        send_page_view: true,
      });
    }
  };

  if (consentGiven === null) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
        <p className="mb-3">We use cookies to improve your experience.</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleConsent(true)}
            className="rounded bg-primary px-4 py-2 text-white"
          >
            Accept
          </button>
          <button
            onClick={() => handleConsent(false)}
            className="rounded bg-gray-200 px-4 py-2 dark:bg-gray-700"
          >
            Reject
          </button>
        </div>
      </div>
    );
  }

  return null;
}
