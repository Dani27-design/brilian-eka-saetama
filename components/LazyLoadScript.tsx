"use client";

import { useEffect, useState } from "react";

interface LazyScriptProps {
  src: string;
  async?: boolean;
  defer?: boolean;
  id?: string;
}

export default function LazyLoadScript({
  src,
  async = true,
  defer = true,
  id,
}: LazyScriptProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && !loaded) {
        const script = document.createElement("script");
        script.src = src;
        if (id) script.id = id;
        script.async = async;
        script.defer = defer;

        script.onload = () => setLoaded(true);
        document.body.appendChild(script);
      }
    };

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: "200px 0px",
    });

    // Observe a marker element
    const marker = document.createElement("div");
    document.body.appendChild(marker);
    observer.observe(marker);

    return () => {
      observer.disconnect();
      if (document.body.contains(marker)) {
        document.body.removeChild(marker);
      }
    };
  }, [src, async, defer, id, loaded]);

  return null;
}
