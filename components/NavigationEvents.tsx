"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter as useNextRouter } from "next/navigation";

export function NavigationEvents({ setIsNavigating }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useNextRouter();

  useEffect(() => {
    // When component mounts, we're not navigating
    setIsNavigating(false);
  }, [setIsNavigating]);

  useEffect(() => {
    // Track link clicks (for <Link> and <a> elements)
    const handleLinkClick = (e) => {
      const target = e.target.closest("a");
      if (!target) return;

      if (
        target &&
        target.href &&
        !target.target &&
        !target.download &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        target.href.startsWith(window.location.origin) &&
        target.href !== window.location.href
      ) {
        setIsNavigating(true);
      }
    };

    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, [setIsNavigating]);

  // Handle router.push() navigation in Next.js
  useEffect(() => {
    // Patch Next.js router to capture programmatic navigation
    const originalPush = router.push;
    const originalReplace = router.replace;

    router.push = (...args) => {
      setIsNavigating(true);
      return originalPush.apply(router, args);
    };

    router.replace = (...args) => {
      setIsNavigating(true);
      return originalReplace.apply(router, args);
    };

    // Handle direct window.location changes
    const handleBeforeUnload = () => {
      setIsNavigating(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // Restore original methods
      router.push = originalPush;
      router.replace = originalReplace;
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [router, setIsNavigating]);

  // This effect runs when pathname or searchParams change
  // which means navigation has completed
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams, setIsNavigating]);

  return null;
}
