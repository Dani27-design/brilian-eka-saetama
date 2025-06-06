"use client";

import { useEffect, useState } from "react";
import { initializeAnalytics } from "@/db/firebase/firebaseAnalytics";

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID || "";

export default function Analytics() {
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);

  useEffect(() => {
    // Browser-only code
    try {
      // Check for existing consent
      const savedConsent = localStorage.getItem("analytics-consent");
      if (savedConsent) {
        setConsentGiven(savedConsent === "true");

        // Initialize analytics if consent was given
        if (savedConsent === "true") {
          initAnalytics();
        }
      }
    } catch (error) {
      console.error("Error checking consent:", error);
    }
  }, []);

  const initAnalytics = async () => {
    try {
      // Initialize Firebase Analytics
      await initializeAnalytics();

      // Load Google Tag Manager script
      const script = document.createElement("script");
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
      script.async = true;
      document.body.appendChild(script);

      // Initialize dataLayer and gtag
      window.dataLayer = window.dataLayer || [];
      const gtag = function (...args: any[]) {
        // @ts-ignore - TS doesn't know about dataLayer
        window.dataLayer.push(arguments);
      };
      gtag("js", new Date());
      gtag("config", GA_TRACKING_ID);
    } catch (err) {
      console.error("Failed to initialize analytics:", err);
    }
  };

  const handleConsent = (consent: boolean) => {
    try {
      localStorage.setItem("analytics-consent", consent.toString());
      setConsentGiven(consent);

      if (consent) {
        initAnalytics();
      }
    } catch (error) {
      console.error("Error handling consent:", error);
    }
  };

  // Only render consent dialog when needed
  if (consentGiven !== null) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto w-fit max-w-lg items-center justify-center rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
      <p className="mx-auto mb-3">We use cookies to improve your experience.</p>
      <div className="mx-auto flex gap-2">
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
