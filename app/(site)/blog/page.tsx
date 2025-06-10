import { Metadata } from "next";
import BlogPageClient from "./BlogPageClient";

export const metadata: Metadata = {
  title: "Blog | PT. Brilian Eka Saetama",
  description:
    "Temukan wawasan ahli seputar sistem keamanan dan keselamatan kebakaran bersama PT. Brilian Eka Saetama, solusi terpercaya untuk perlindungan gedung dan aset Anda.",
  applicationName: "PT Brilian Eka Saetama",
  authors: [
    {
      name: "PT. Brilian Eka Saetama",
      url: "https://brilian-eka-saetama.vercel.app",
    },
  ],
  generator: "Next.js",
  keywords: [
    "blog pt brilian eka saetama",
    "blog keamanan",
    "blog keselamatan kebakaran",
    "proteksi kebakaran",
    "sistem keamanan",
    "keselamatan gedung",
    "PT Brilian Eka Saetama",
    "blog keamanan",
    "blog keselamatan kebakaran",
  ],
  referrer: "origin-when-cross-origin",
  creator: "PT Brilian Eka Saetama",
  publisher: "PT Brilian Eka Saetama",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  category: "safety services",
  openGraph: {
    title: "Blog | PT. Brilian Eka Saetama",
    description:
      "Temukan wawasan ahli seputar sistem keamanan dan keselamatan kebakaran bersama PT. Brilian Eka Saetama, solusi terpercaya untuk perlindungan gedung dan aset Anda.",
    url: "https://brilian-eka-saetama.vercel.app/blog",
    siteName: "PT. Brilian Eka Saetama Blog",
    type: "website",
    images: [
      {
        url: "https://brilian-eka-saetama.vercel.app/images/logo/logo-light.png",
        width: 1200,
        height: 630,
        alt: "PT. Brilian Eka Saetama Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | PT. Brilian Eka Saetama",
    description:
      "Temukan wawasan ahli seputar sistem keamanan dan keselamatan kebakaran bersama PT. Brilian Eka Saetama, solusi terpercaya untuk perlindungan gedung dan aset Anda.",
    images: [
      "https://brilian-eka-saetama.vercel.app/images/logo/logo-light.png",
    ],
  },
  icons: {
    icon: "/images/favicon.ico",
    apple: "/images/apple-touch-icon.png",
    shortcut: "/images/favicon.ico",
  },
  verification: {
    google: "4uXsTxUZBjcn1Vifok5UuP1imEhnZn0waWYKMnLG-Nw",
  },
  alternates: {
    canonical: `https://brilian-eka-saetama.vercel.app/blog`,
    languages: {
      "en-US": `https://brilian-eka-saetama.vercel.app/blog`,
      "id-ID": `https://brilian-eka-saetama.vercel.app/blog`,
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  metadataBase: new URL(`https://brilian-eka-saetama.vercel.app/blog`),
};

export default function BlogPage() {
  return (
    <>
      {/* Add JSON-LD structured data for blog list */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "PT. Brilian Eka Saetama Blog",
            description:
              "Temukan wawasan ahli seputar sistem keamanan dan keselamatan kebakaran bersama PT. Brilian Eka Saetama, solusi terpercaya untuk perlindungan gedung dan aset Anda.",
            url: "https://brilian-eka-saetama.vercel.app/blog",
            publisher: {
              "@type": "Organization",
              name: "PT. Brilian Eka Saetama",
              logo: {
                "@type": "ImageObject",
                url: "https://brilian-eka-saetama.vercel.app/images/logo/logo-light.png",
              },
            },
          }),
        }}
      />
      <BlogPageClient />
    </>
  );
}
