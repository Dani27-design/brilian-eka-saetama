"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Lines from "@/components/Lines";
import ScrollToTop from "@/components/ScrollToTop";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import "../globals.css";
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Arial", "sans-serif"],
  variable: "--font-inter",
});

import ToasterContext from "../context/ToastContext";
import { Providers } from "../providers";
import { LanguageProvider } from "../context/LanguageContext";
import SchemaMarkup from "@/components/SchemaMarkup";
import LazyLoadScript from "@/components/LazyLoadScript";
import PerformanceOptimizer from "@/components/PerformanceOptimizer";
import Analytics from "@/components/Analytics";
import CriticalPreload from "@/components/CriticalPreload";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <SchemaMarkup />
        {/* Preconnect to domains for early connection establishment */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://www.googletagmanager.com" />

        {/* Critical CSS preload */}
        {/* Enhanced favicon setup */}
        <link rel="icon" href="/images/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/images/logo/logo-light.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* DNS prefetch for third-party domains */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <CriticalPreload
          assets={[
            // LCP images
            "/images/logo/logo-light.png",
            "/images/logo/logo-dark.png",

            // firestore
            "https://firestore.googleapis.com",

            // firebase storage
            "https://firebasestorage.googleapis.com",
          ]}
        />
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
      </body>
    </html>
  );
}
