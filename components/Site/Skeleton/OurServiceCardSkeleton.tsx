import React from "react";

// Simplified version without motion for better performance on slow connections
const ServiceCardSkeleton = () => {
  return (
    <div className="z-40 rounded-lg border border-white bg-white p-7.5 shadow-solid-3 transition-all dark:border-strokedark dark:bg-blacksection xl:p-12.5">
      {/* Image skeleton */}
      <div className="h-52 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />

      {/* Title skeleton */}
      <div className="mb-5 mt-7.5">
        <div className="h-7 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Description skeleton */}
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
};

export default ServiceCardSkeleton;
