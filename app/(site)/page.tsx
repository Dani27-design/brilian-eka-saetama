import { Metadata } from "next";
import Hero from "@/components/Hero";
import About from "@/components/About";
import OurClients from "@/components/OurClients";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Blog from "@/components/Blog";
import Testimonial from "@/components/Testimonial";
import Services from "@/components/OurServices";
import ClientsInfo from "@/components/OurClientsInfo";

export const metadata: Metadata = {
  metadataBase: new URL("https://brilian-eka-saetama.vercel.app"),
  title: "PT Brilian Eka Saetama | Solusi Keamanan Kebakaran Terpercaya",
  description:
    "PT. Brilian Eka Saetama (BES) telah lama berkomitmen menjadi mitra utama dalam keselamatan dengan menyediakan solusi keamanan dari bahaya kebakaran. Kami berkomitmen untuk memberikan layanan pemasangan sistem perangkat pendukung dengan standar kualitas terbaik, membantu masyarakat dan perusahaan menjaga aset mereka dari risiko kebakaran, serta menciptakan lingkungan yang aman dan terlindungi.",
  applicationName: "PT Brilian Eka Saetama",
  authors: [
    {
      name: "PT Brilian Eka Saetama",
      url: "https://brilian-eka-saetama.vercel.app",
    },
  ],
  generator: "Next.js",
  keywords: [
    "pt brilian eka saetama",
    "brilian eka saetama",
    "bes",
    "pt bes",
    "brilian eka saetama bes",
    "kebakaran",
    "alat pemadam api",
    "fire extinguisher",
    "jasa pemasangan alat pemadam kebakaran",
    "mitra penyedia jasa keamanan kebakaran",
    "apar",
    "fire alarm system",
    "hydrant",
    "sprinkler",
    "fire safety",
    "smoke detector",
    "proteksi kebakaran",
    "instalasi hydrant",
    "jasa fire safety",
    "konsultan kebakaran",
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
    title: "PT Brilian Eka Saetama | Solusi Keamanan Kebakaran Terpercaya",
    description:
      "PT. Brilian Eka Saetama (BES) telah lama berkomitmen menjadi mitra utama dalam keselamatan dengan menyediakan solusi keamanan dari bahaya kebakaran. Kami berkomitmen untuk memberikan layanan pemasangan sistem perangkat pendukung dengan standar kualitas terbaik, membantu masyarakat dan perusahaan menjaga aset mereka dari risiko kebakaran, serta menciptakan lingkungan yang aman dan terlindungi.",
    siteName: "PT Brilian Eka Saetama",
    images: [
      {
        url: "https://brilian-eka-saetama.vercel.app/images/logo/logo-light.png",
        secureUrl:
          "https://brilian-eka-saetama.vercel.app/images/logo/logo-light.png",
        width: 1200,
        height: 630,
        alt: "PT Brilian Eka Saetama",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PT Brilian Eka Saetama | Solusi Keamanan Kebakaran Terpercaya",
    description:
      "PT. Brilian Eka Saetama (BES) telah lama berkomitmen menjadi mitra utama dalam keselamatan dengan menyediakan solusi keamanan dari bahaya kebakaran. Kami berkomitmen untuk memberikan layanan pemasangan sistem perangkat pendukung dengan standar kualitas terbaik, membantu masyarakat dan perusahaan menjaga aset mereka dari risiko kebakaran, serta menciptakan lingkungan yang aman dan terlindungi.",
    images: [
      "https://brilian-eka-saetama.vercel.app/images/logo/logo-light.png",
    ],
    site: "@ptbrilianekasaetama",
    creator: "@ptbrilianekasaetama",
  },
  icons: {
    icon: "/images/favicon.ico",
    apple: "/images/favicon.ico",
    shortcut: "/images/favicon.ico",
    other: [
      {
        rel: "apple-touch-icon",
        url: "/images/favicon.ico",
      },
      {
        rel: "mask-icon",
        url: "/images/favicon.ico",
        color: "#000000",
      },
    ],
  },
  verification: {
    google: "4uXsTxUZBjcn1Vifok5UuP1imEhnZn0waWYKMnLG-Nw",
  },
  alternates: {
    canonical: "https://brilian-eka-saetama.vercel.app",
    languages: {
      "en-US": "https://brilian-eka-saetama.vercel.app/en",
      "id-ID": "https://brilian-eka-saetama.vercel.app",
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
};

export default function Home() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden">
      <Hero />
      <Services />
      <About />
      <OurClients />
      <ClientsInfo />
      <FAQ />
      <Testimonial />
      <Contact />
      <Blog />
    </main>
  );
}
