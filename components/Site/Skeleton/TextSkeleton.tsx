import React from "react";

interface TextSkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

const TextSkeleton: React.FC<TextSkeletonProps> = React.memo(
  ({ width = "100%", height = "1.5rem", className = "" }) => {
    return (
      <div
        className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`}
        style={{ width, height }}
      />
    );
  },
);

TextSkeleton.displayName = "TextSkeleton";
export default TextSkeleton;
