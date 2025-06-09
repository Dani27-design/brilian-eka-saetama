"use client";

import { useNavigation } from "@/context/NavigationContext";
import { useEffect, useState } from "react";

export default function LoadingModal() {
  const { isNavigating } = useNavigation();
  const [loadingState, setLoadingState] = useState("idle"); // idle, minimal, full

  useEffect(() => {
    let minimalTimer: NodeJS.Timeout;
    let fullTimer: NodeJS.Timeout;

    if (isNavigating) {
      // First show a minimal loading indicator after a short delay
      minimalTimer = setTimeout(() => {
        setLoadingState("minimal");

        // If navigation takes longer, show the full modal
        fullTimer = setTimeout(() => {
          setLoadingState("full");
        }, 1000); // Show full modal after 1.5 seconds
      }, 300); // Show minimal indicator after 300ms
    } else {
      // Navigation completed - reset with a small delay for smooth transition
      const resetTimer = setTimeout(() => {
        setLoadingState("idle");
      }, 150);

      return () => clearTimeout(resetTimer);
    }

    return () => {
      clearTimeout(minimalTimer);
      clearTimeout(fullTimer);
    };
  }, [isNavigating]);

  // Return null when idle
  if (loadingState === "idle") return null;

  // Minimal loading indicator (progress bar)
  if (loadingState === "minimal") {
    return (
      <div className="fixed left-0 top-0 z-50 w-full">
        <div className="h-1 animate-pulse bg-primary">
          <div className="h-full w-1/3 animate-[progressBar_1.5s_ease-in-out_infinite] bg-primary"></div>
        </div>
      </div>
    );
  }

  // Full loading modal for slow connections
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-lg bg-white p-6 shadow-xl dark:bg-blacksection">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium text-black dark:text-white">
            Loading...
          </p>
        </div>
      </div>
    </div>
  );
}
