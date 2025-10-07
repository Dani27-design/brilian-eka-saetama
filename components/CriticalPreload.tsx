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

    // Preload critical assets with proper crossorigin
    assets.forEach((asset) => {
      const link = document.createElement("link");
      link.rel = "preload";
      const isImage = asset.endsWith(".png") || asset.endsWith(".jpg") || asset.endsWith(".webp");
      link.as = isImage ? "image" : "fetch";
      link.href = asset;
      
      // Add crossorigin for same-origin resources to match usage
      if (isImage && (asset.startsWith("/") || asset.includes(window.location.hostname))) {
        link.crossOrigin = "anonymous";
      }
      
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
      {/* Only preload truly critical LCP images */}
      <link
        rel="preload"
        href="/images/shape/shape-01.png"
        as="image"
        fetchPriority="high"
        crossOrigin="anonymous"
      />
      
      {/* Preconnect to critical origins */}
      <link rel="preconnect" href="https://firestore.googleapis.com" />
      <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
    </Head>
  );
}
