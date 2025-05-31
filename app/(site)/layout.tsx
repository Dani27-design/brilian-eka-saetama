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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <SchemaMarkup />
      </head>
      <body className={`dark:bg-black ${inter.className}`}>
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
              <LazyLoadScript />
              {children}
              <Footer />
              <ScrollToTop />
            </LanguageProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
