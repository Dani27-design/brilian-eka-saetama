import React from "react";

const SectionHeaderSkeleton = () => {
  return (
    <div className="wow animate_top mx-auto w-[90%] text-center">
      <div className="mb-4 inline-block rounded-full bg-zumthor px-4.5 py-1.5 dark:border dark:border-strokedark dark:bg-blacksection">
        <div className="h-5 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mx-auto mb-4 h-8 w-full max-w-[90%] animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mx-auto w-full max-w-[90%]">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mx-auto h-4 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
};

export default SectionHeaderSkeleton;
