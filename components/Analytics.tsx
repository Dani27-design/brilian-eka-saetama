"use client";

import Script from "next/script";
import { useEffect } from "react";

// Replace with your actual Google Analytics ID
const GA_TRACKING_ID = "G-XXXXXXXXXX";

export default function Analytics() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize the dataLayer array
    window.dataLayer = window.dataLayer || [];

    // Define the gtag function
    function gtag(...args: any[]) {
      // @ts-ignore - TS doesn't know about dataLayer
      window.dataLayer.push(arguments);
    }

    // Initialize gtag with your tracking ID
    gtag("js", new Date());
    gtag("config", GA_TRACKING_ID, {
      page_path: window.location.pathname,
      transport_type: "beacon",
      anonymize_ip: true,
      send_page_view: true,
    });
  }, []);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />
    </>
  );
}
