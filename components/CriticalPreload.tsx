"use client";

import { useEffect } from "react";
import Head from "next/head";

interface CriticalPreloadProps {
  assets?: string[];
}

export default function CriticalPreload({ assets = [] }: CriticalPreloadProps) {
  // List font files or critical assets to preload
  const defaultPreloads = [
    // Add your critical fonts/assets here
    // Example: "/fonts/your-main-font.woff2"
  ];

  const allAssets = [...defaultPreloads, ...assets];

  return (
    <>
      {allAssets.map((asset, index) => {
        const isFont =
          asset.endsWith(".woff2") ||
          asset.endsWith(".woff") ||
          asset.endsWith(".ttf");
        const isImage =
          asset.endsWith(".jpg") ||
          asset.endsWith(".png") ||
          asset.endsWith(".webp");

        return (
          <link
            key={index}
            rel="preload"
            href={asset}
            as={isFont ? "font" : isImage ? "image" : "fetch"}
            type={isFont ? "font/woff2" : undefined}
            crossOrigin={isFont ? "anonymous" : undefined}
          />
        );
      })}
    </>
  );
}
