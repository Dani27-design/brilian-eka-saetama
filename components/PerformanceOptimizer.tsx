"use client";

import { useEffect } from "react";

export default function PerformanceOptimizer() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // ===== LCP OPTIMIZATIONS =====
    const optimizeLCP = () => {
      // High-priority images should load quickly
      document.querySelectorAll('img[fetchpriority="high"]').forEach((img) => {
        if (!img.hasAttribute("decoding")) {
          img.setAttribute("decoding", "async");
        }
      });

      // Add preconnect for external domains
      const domains = [
        "https://www.googletagmanager.com",
        "https://firestore.googleapis.com",
        // Add other important external domains here
      ];

      domains.forEach((domain) => {
        const link = document.createElement("link");
        link.rel = "preconnect";
        link.href = domain;
        document.head.appendChild(link);

        // Also add DNS prefetch as fallback
        const dnsLink = document.createElement("link");
        dnsLink.rel = "dns-prefetch";
        dnsLink.href = domain;
        document.head.appendChild(dnsLink);
      });
    };

    // ===== CLS OPTIMIZATIONS =====
    const preventCLS = () => {
      // Set fixed dimensions for images without dimensions
      document
        .querySelectorAll("img:not([width]):not([height])")
        .forEach((img) => {
          img.setAttribute("width", "100%");
          (img as HTMLImageElement).style.aspectRatio = "auto";
        });

      // Reserve space for dynamic content
      document.querySelectorAll(".dynamic-height").forEach((el) => {
        (el as HTMLElement).style.minHeight = "300px"; // Set appropriate minimum height
      });
    };

    // ===== REDUCE JAVASCRIPT EXECUTION =====
    const optimizeJSExecution = () => {
      // Use requestIdleCallback for non-critical operations
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => {
          // Run non-essential code here
          loadNonEssentialScripts();
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(loadNonEssentialScripts, 2000);
      }
    };

    const loadNonEssentialScripts = () => {
      // Load non-critical third-party scripts here
      const nonCriticalScripts = [
        // Add paths to non-essential scripts
      ];

      nonCriticalScripts.forEach((script) => {
        const scriptEl = document.createElement("script");
        scriptEl.src = script;
        scriptEl.async = true;
        scriptEl.defer = true;
        document.body.appendChild(scriptEl);
      });
    };

    // Run optimizations after the component mounts
    optimizeLCP();
    preventCLS();
    optimizeJSExecution();

    // Add scroll optimization
    let isScrolling = false;
    let scrollTimeout: number;

    const scrollHandler = () => {
      if (!isScrolling) {
        document.body.classList.add("is-scrolling");
        isScrolling = true;
      }

      // Clear timeout if it exists
      if (scrollTimeout) clearTimeout(scrollTimeout);

      // Set timeout to remove class after scrolling stops
      scrollTimeout = window.setTimeout(() => {
        document.body.classList.remove("is-scrolling");
        isScrolling = false;
      }, 100);
    };

    window.addEventListener("scroll", scrollHandler, { passive: true });

    return () => {
      // Cleanup event listeners
      window.removeEventListener("scroll", scrollHandler);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  return null;
}
