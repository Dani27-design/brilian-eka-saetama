"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationEvents({ setIsNavigating }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // When component mounts, we're not navigating
    setIsNavigating(false);
  }, [setIsNavigating]);

  useEffect(() => {
    // Only track link clicks, which is much more efficient
    const handleLinkClick = (e) => {
      // Only handle link clicks, ignore other clicks
      const target = e.target.closest("a");
      if (!target) return;

      // Only handle internal navigation
      if (
        target &&
        target.href &&
        !target.target && // Not opening in new tab
        !target.download && // Not a download link
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey && // Not modified clicks
        target.href.startsWith(window.location.origin) &&
        target.href !== window.location.href
      ) {
        setIsNavigating(true);
      }
    };

    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, [setIsNavigating]);

  useEffect(() => {
    // This effect runs when pathname or searchParams change
    // which means navigation has completed
    setIsNavigating(false);
  }, [pathname, searchParams, setIsNavigating]);

  return null;
}
