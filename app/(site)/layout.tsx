import Footer from "@/components/Site/Footer";
import Header from "@/components/Site/Header"; // This will use the ServerHeader component
import Lines from "@/components/Lines";
import ScrollToTop from "@/components/Site/ScrollToTop";
import { Inter, Roboto } from "next/font/google";
import "../globals.css";
import { cookies } from "next/headers";
import SchemaMarkup from "@/components/SchemaMarkup";
import { ClientLayoutWrapper } from "./ClientLayoutWrapper";

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

// Add inline critical CSS
const criticalCSS = `
  /* Essential styles for above-the-fold content */
  body { 
    margin: 0; 
    font-family: 'Inter', sans-serif; 
    text-rendering: optimizeSpeed;
  }
  /* Add more critical styles here */
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ambil bahasa dari cookie saat server rendering
  const cookieStore = cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "id";

  return (
    <html
      lang={locale}
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
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
      </head>
      <body className={`dark:bg-black ${inter.className} preload`}>
        <ClientLayoutWrapper locale={locale}>
          <Lines />
          <Header />
          {/* Skip to content link for accessibility */}
          <a href="#main-content" className="sr-only focus:not-sr-only">
            Skip to content
          </a>
          <main id="main-content">{children}</main>
          <Footer />
          <ScrollToTop />
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}
