"use client";

import { useEffect } from "react";
import Head from "next/head";

interface CriticalPreloadProps {
  assets?: string[];
}

export default function CriticalPreload({ assets = [] }: CriticalPreloadProps) {
  useEffect(() => {
    // Browser-side code only
    if (typeof document === "undefined") return;

    // Preload critical assets
    assets.forEach((asset) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as =
        asset.endsWith(".png") ||
        asset.endsWith(".jpg") ||
        asset.endsWith(".webp")
          ? "image"
          : "fetch";
      link.href = asset;
      document.head.appendChild(link);
    });

    // Preconnect to Google Fonts
    const googleFontsPreconnect = document.createElement("link");
    googleFontsPreconnect.rel = "preconnect";
    googleFontsPreconnect.href = "https://fonts.googleapis.com";
    googleFontsPreconnect.crossOrigin = "anonymous";
    document.head.appendChild(googleFontsPreconnect);

    const gstaticPreconnect = document.createElement("link");
    gstaticPreconnect.rel = "preconnect";
    gstaticPreconnect.href = "https://fonts.gstatic.com";
    gstaticPreconnect.crossOrigin = "anonymous";
    document.head.appendChild(gstaticPreconnect);
  }, [assets]);

  return (
    <Head>
      {/* Preload LCP image */}
      <link
        rel="preload"
        href="/images/shape/shape-01.png"
        as="image"
        fetchPriority="high"
      />
      <link
        rel="preload"
        href="/images/shape/shape-02.svg"
        as="image"
        fetchPriority="high"
      />
      <link
        rel="preload"
        href="/images/shape/shape-03.svg"
        as="image"
        fetchPriority="high"
      />
      <link
        rel="preload"
        href="/images/shape/shape-04.png"
        as="image"
        fetchPriority="high"
      />
      <link
        rel="preload"
        href="/images/shape/shape-05.png"
        as="image"
        fetchPriority="high"
      />
      <link
        rel="preload"
        href="/images/shape/shape-06.png"
        as="image"
        fetchPriority="high"
      />

      {/* Preconnect to critical origins */}
      <link rel="preconnect" href="https://firestore.googleapis.com" />
      <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
    </Head>
  );
}
