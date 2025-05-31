"use client";

import { useEffect } from "react";

export default function PerformanceOptimizer() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Defer non-critical resources
    const deferNonCritical = () => {
      // Defer non-critical images loading
      document.querySelectorAll('img:not([loading="eager"])').forEach((img) => {
        if (!img.hasAttribute("loading")) {
          img.setAttribute("loading", "lazy");
        }
      });

      // Defer non-critical JS
      const deferScripts = document.querySelectorAll("script[data-defer]");
      deferScripts.forEach((script) => {
        script.setAttribute("defer", "");
      });
    };

    // Execute during idle time
    if ("requestIdleCallback" in window) {
      // @ts-ignore - TypeScript doesn't recognize requestIdleCallback
      window.requestIdleCallback(deferNonCritical);
    } else {
      setTimeout(deferNonCritical, 1000);
    }

    // Add mobile-specific optimizations
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      // Reduce animation complexity
      document.documentElement.classList.add("reduce-motion");

      // Defer below-fold styles
      document.querySelectorAll("link[data-below-fold]").forEach((link) => {
        link.setAttribute("media", "none");
        link.setAttribute("onload", "this.media='all'");
      });
    }

    return () => {
      // Clean up
    };
  }, []);

  return null;
}
