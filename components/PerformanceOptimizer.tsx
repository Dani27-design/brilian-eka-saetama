"use client";

import { useEffect } from "react";

export default function PerformanceOptimizer() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Wait until idle time to load non-critical resources
    if ("requestIdleCallback" in window) {
      // @ts-ignore - TypeScript might not recognize requestIdleCallback
      window.requestIdleCallback(() => {
        // Preload remaining stylesheets
        const preloadLinks = document.querySelectorAll(
          'link[rel="preload"][as="style"]',
        );
        preloadLinks.forEach((link) => {
          const stylesheetLink = document.createElement("link");
          stylesheetLink.rel = "stylesheet";
          stylesheetLink.href = (link as HTMLLinkElement).href;
          document.head.appendChild(stylesheetLink);
        });
      });
    }

    // Remove unused event listeners for better memory usage
    const cleanup = () => {
      // Clean up any global listeners if needed
    };

    return cleanup;
  }, []);

  return null;
}
