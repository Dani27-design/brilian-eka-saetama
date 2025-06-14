"use client";

import { ReactNode, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "../context/LanguageContext";
import ToasterContext from "../context/ToastContext";
import { Providers } from "../providers";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// Dynamically import browser-only components
const CriticalPreload = dynamic(() => import("@/components/CriticalPreload"), {
  ssr: false,
});

const PerformanceOptimizer = dynamic(
  () => import("@/components/PerformanceOptimizer"),
  { ssr: false },
);

const Analytics = dynamic(() => import("@/components/Analytics"), {
  ssr: false,
});

const LazyLoadScript = dynamic(() => import("@/components/LazyLoadScript"), {
  ssr: false,
});

export function ClientLayoutWrapper({
  children,
  locale,
}: {
  children: ReactNode;
  locale: string;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // Avoid using unload event
    window.addEventListener("pagehide", () => {
      // Clean up operations that would otherwise use unload or beforeunload
    });

    // Clear all beforeunload listeners that might exist
    window.onbeforeunload = null;

    // Close any open connections on navigation
    return () => {
      // Clean up open connections
    };
  }, [pathname]);

  return (
    <Providers>
      <ThemeProvider
        enableSystem={false}
        attribute="class"
        defaultTheme="light"
      >
        <LanguageProvider initialLanguage={locale}>
          <CriticalPreload
            assets={[
              "/images/logo/logo-light.png",
              "/images/logo/logo-dark.png",
            ]}
          />
          <ToasterContext />
          <PerformanceOptimizer />
          <Analytics />
          {children}

          {/* Third-party scripts loaded only when needed */}
          <LazyLoadScript
            src="https://www.googletagmanager.com/gtag/js?id=YOUR-ID"
            async={true}
            defer={true}
          />

          {/* Any other non-critical scripts */}
          <LazyLoadScript
            src="/js/non-critical-functionality.js"
            async={true}
            defer={true}
          />
        </LanguageProvider>
      </ThemeProvider>
    </Providers>
  );
}
