"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Lines from "@/components/Lines";
import ScrollToTop from "@/components/ScrollToTop";
import { ThemeProvider } from "next-themes";
import { Inter, Roboto } from "next/font/google";
import "../globals.css";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

import ToasterContext from "../context/ToastContext";
import { Providers } from "../providers";
import { LanguageProvider } from "../context/LanguageContext";
import SchemaMarkup from "@/components/SchemaMarkup";

// Dynamically import browser-only components
const CriticalPreload = dynamic(() => import("@/components/CriticalPreload"), {
  ssr: false,
});

const PerformanceOptimizer = dynamic(
  () => import("@/components/PerformanceOptimizer"),
  {
    ssr: false,
  },
);

const Analytics = dynamic(() => import("@/components/Analytics"), {
  ssr: false,
});

const LazyLoadScript = dynamic(() => import("@/components/LazyLoadScript"), {
  ssr: false,
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Arial", "sans-serif"],
  variable: "--font-inter",
});

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

// Add inline critical CSS to the <head> section
// Extract critical CSS from your CSS files
const criticalCSS = `
  /* Essential styles for above-the-fold content */
  body { 
    margin: 0; 
    font-family: 'Inter', sans-serif; 
    text-rendering: optimizeSpeed;
  }
  /* Add more critical styles here */
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
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
    <html
      lang="id"
      suppressHydrationWarning
      className={`${inter.variable} ${roboto.variable}`}
    >
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <SchemaMarkup />
        {/* Enhanced favicon setup */}
        <link rel="icon" href="/images/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/images/logo/logo-light.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* DNS prefetch for third-party domains */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <CriticalPreload
          assets={["/images/logo/logo-light.png", "/images/logo/logo-dark.png"]}
        />
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
      </head>
      <body className={`dark:bg-black ${inter.className} preload`}>
        <Providers>
          <ThemeProvider
            enableSystem={false}
            attribute="class"
            defaultTheme="light"
          >
            <LanguageProvider>
              <Lines />
              <Header />
              <ToasterContext />
              <PerformanceOptimizer />
              <Analytics />
              {/* Skip to content link for accessibility */}
              <a href="#main-content" className="sr-only focus:not-sr-only">
                Skip to content
              </a>
              <main id="main-content">{children}</main>
              <Footer />
              <ScrollToTop />
            </LanguageProvider>
          </ThemeProvider>
        </Providers>
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
      </body>
    </html>
  );
}
