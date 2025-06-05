"use client";

import Image from "next/image";
import { useState } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fetchPriority?: "high" | "low" | "auto";
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  fetchPriority = "auto",
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`${className} ${isLoaded ? "opacity-100" : "opacity-0"}`}
      onLoadingComplete={() => setIsLoaded(true)}
      priority={priority}
      fetchPriority={priority ? "high" : fetchPriority}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      style={{
        transition: "opacity 0.3s",
        aspectRatio: width && height ? `${width}/${height}` : "auto",
      }}
    />
  );
}
