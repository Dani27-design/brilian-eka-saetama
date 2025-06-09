import { Metadata } from "next";
import BlogPageClient from "./BlogPageClient";

export const metadata: Metadata = {
  title: "Blog | PT. Brilian Eka Saetama",
  description:
    "Temukan wawasan ahli seputar sistem keamanan dan keselamatan kebakaran bersama PT. Brilian Eka Saetama, solusi terpercaya untuk perlindungan gedung dan aset Anda.",
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
  alternates: {
    canonical: "https://brilian-eka-saetama.vercel.app/blog",
  },
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
