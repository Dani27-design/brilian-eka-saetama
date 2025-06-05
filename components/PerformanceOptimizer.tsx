"use client";

import { useEffect } from "react";

export default function PerformanceOptimizer() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // ===== LCP OPTIMIZATIONS =====
    const optimizeLCP = () => {
      // High-priority images should load quickly
      document.querySelectorAll('img[fetchpriority="high"]').forEach((img) => {
        // Make sure we don't change decoding attribute if it's already set
        if (!img.hasAttribute("decoding")) {
          img.setAttribute("decoding", "async"); // Keep consistent with client rendering
        }
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
    };

    // Run optimizations after the component mounts
    optimizeLCP();
    preventCLS();

    return () => {
      // Cleanup if needed
    };
  }, []);

  return null;
}
