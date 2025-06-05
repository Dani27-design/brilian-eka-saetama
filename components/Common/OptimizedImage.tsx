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
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
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
      // Use consistent decoding attribute
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      style={{ transition: "opacity 0.3s" }}
    />
  );
}
