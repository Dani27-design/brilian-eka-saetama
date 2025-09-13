import { Inter } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "PT Brilian Eka Saetama",
    template: "%s | PT Brilian Eka Saetama"
  },
  description: "PT Brilian Eka Saetama - Your Business Partner",
  icons: {
    icon: "/images/favicon.ico",
    apple: "/images/logo/logo-light.png",
  },
  manifest: "/manifest.json",
};

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
        {/* DNS prefetch for third-party domains */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className={`${inter.className} dark:bg-black`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}