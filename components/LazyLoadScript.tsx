"use client";

import { useEffect, useState } from "react";

interface LazyLoadScriptProps {
  src: string;
  id?: string;
  strategy?: "afterInteraction" | "onVisible" | "onIdle" | "onLoad";
  onLoad?: () => void;
}

export default function LazyLoadScript({
  src,
  id,
  strategy = "afterInteraction",
  onLoad,
}: LazyLoadScriptProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadScript = () => {
      if (document.getElementById(id || src)) {
        setLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      if (id) script.id = id;

      script.onload = () => {
        setLoaded(true);
        if (onLoad) onLoad();
      };

      document.body.appendChild(script);
    };

    let observer: IntersectionObserver | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let interactionEvents: string[] = [];
    let handleInteraction: (() => void) | undefined;

    // Different loading strategies
    switch (strategy) {
      case "afterInteraction":
        // Load after user interaction
        interactionEvents = ["click", "scroll", "keydown"];
        handleInteraction = () => {
          loadScript();
          interactionEvents.forEach((event) =>
            window.removeEventListener(event, handleInteraction!),
          );
        };

        interactionEvents.forEach((event) => {
          if (handleInteraction) {
            window.addEventListener(event, handleInteraction, { once: true });
          }
        });
        break;

      case "onVisible":
        // Load when element would be visible
        observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            loadScript();
            observer?.disconnect();
          }
        });

        observer.observe(document.documentElement);
        break;

      case "onIdle":
        // Load during browser idle time
        if ("requestIdleCallback" in window) {
          // @ts-ignore
          window.requestIdleCallback(loadScript);
        } else {
          timeout = setTimeout(loadScript, 2000);
        }
      case "onLoad":
      default:
        // Load after window load
        if (document.readyState === "complete") {
          loadScript();
        } else {
          window.addEventListener("load", loadScript, { once: true });
        }
        break;
    }

    return () => {
      if (handleInteraction) {
        interactionEvents.forEach((event) =>
          window.removeEventListener(event, handleInteraction!),
        );
      }
      observer?.disconnect();
      if (timeout) clearTimeout(timeout);
    };
  }, [src, id, strategy, onLoad]);

  return null;
}
