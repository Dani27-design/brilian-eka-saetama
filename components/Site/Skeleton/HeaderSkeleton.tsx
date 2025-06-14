import React from "react";

const HeaderSkeleton = () => {
  return (
    <div className="flex w-full items-center justify-between xl:flex">
      {/* Logo skeleton */}
      <div className="flex w-full items-center justify-between xl:w-1/4">
        <div className="h-[54px] w-[55px] animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
        <div className="block h-5.5 w-5.5 animate-pulse rounded bg-gray-200 dark:bg-gray-700 xl:hidden" />
      </div>

      {/* Nav menu skeleton */}
      <div className="hidden w-full items-center justify-between xl:flex">
        <div className="flex gap-10">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>

        <div className="flex items-center gap-6">
          {/* Theme toggle skeleton */}
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />

          {/* Language selector skeleton */}
          <div className="h-10 w-28 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
};

export default HeaderSkeleton;
