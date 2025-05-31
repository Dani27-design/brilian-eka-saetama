"use client";

import { useEffect } from "react";

export default function LazyLoadScript() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    // Check if Intersection Observer is supported
    if (!("IntersectionObserver" in window)) return;

    // Create an observer instance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Load the component when it's in view
            const section = entry.target;

            // Force the component to load by setting a data attribute
            section.setAttribute("data-loaded", "true");

            // Stop observing once loaded
            observer.unobserve(section);
          }
        });
      },
      {
        rootMargin: "200px", // Start loading 200px before section comes into view
        threshold: 0,
      },
    );

    // Observe all lazy-load sections
    document.querySelectorAll(".lazy-section").forEach((section) => {
      observer.observe(section);
    });

    // Clean up
    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
