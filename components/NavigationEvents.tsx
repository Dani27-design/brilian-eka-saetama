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

      // Skip loading indicator if:
      // 1. The link contains a hash (section navigation)
      // 2. The base URL (without hash) is the same as current page
      if (target && target.href) {
        try {
          const targetUrl = new URL(target.href);
          const currentUrl = new URL(window.location.href);

          // Check if this is just a hash/anchor navigation on the same page
          const isHashNavigation =
            targetUrl.hash !== "" && targetUrl.pathname === currentUrl.pathname;

          // Don't show loading for hash navigation or same-page links
          if (isHashNavigation) {
            return;
          }

          // For normal navigation, proceed with loading indicator
          if (
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
        } catch (error) {
          // If URL parsing fails, fall back to default behavior
          console.error("Error parsing URL:", error);
        }
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
      const path = args[0];

      // Don't show loading indicator for hash navigation
      if (
        typeof path === "string" &&
        (path.includes("#") || path.startsWith("/#"))
      ) {
        // Check if we're just navigating to a section on the same page
        const pathWithoutHash = path.split("#")[0];
        const currentPathWithoutHash = window.location.pathname;

        // If we're staying on the same page, don't trigger loading
        if (
          pathWithoutHash === currentPathWithoutHash ||
          pathWithoutHash === ""
        ) {
          return originalPush.apply(router, args);
        }
      }

      setIsNavigating(true);
      return originalPush.apply(router, args);
    };

    router.replace = (...args) => {
      const path = args[0];

      // Same logic for replace as for push
      if (
        typeof path === "string" &&
        (path.includes("#") || path.startsWith("/#"))
      ) {
        const pathWithoutHash = path.split("#")[0];
        const currentPathWithoutHash = window.location.pathname;

        if (
          pathWithoutHash === currentPathWithoutHash ||
          pathWithoutHash === ""
        ) {
          return originalReplace.apply(router, args);
        }
      }

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
