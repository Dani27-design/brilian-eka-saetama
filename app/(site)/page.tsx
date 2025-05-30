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
  title: "PT Brilian Eka Saetama | Solusi Keamanan Kebakaran Terpercaya",
  description:
    "PT. Brilian Eka Saetama (BES) telah lama berkomitmen menjadi mitra utama dalam keselamatan dengan menyediakan solusi keamanan dari bahaya kebakaran. Kami berkomitmen untuk memberikan layanan pemasangan sistem perangkat pendukung dengan standar kualitas terbaik, membantu masyarakat dan perusahaan menjaga aset mereka dari risiko kebakaran, serta menciptakan lingkungan yang aman dan terlindungi.",
  keywords: [
    "pt brilian eka saetama",
    "brilian eka saetama",
    "bes",
    "pt bes",
    "brilian eka saetama bes",
    "kebakaran",
    "jasa pemasangan alat pemadam kebakaran",
    "mitra penyedia jasa keamanan kebakaran",
  ],
  openGraph: {
    title: "PT Brilian Eka Saetama | Solusi Keamanan Kebakaran Terpercaya",
    description:
      "PT. Brilian Eka Saetama (BES) telah lama berkomitmen menjadi mitra utama dalam keselamatan dengan menyediakan solusi keamanan dari bahaya kebakaran. Kami berkomitmen untuk memberikan layanan pemasangan sistem perangkat pendukung dengan standar kualitas terbaik, membantu masyarakat dan perusahaan menjaga aset mereka dari risiko kebakaran, serta menciptakan lingkungan yang aman dan terlindungi.",
    images: [
      {
        url: "/images/logo/logo-light.png",
        width: 1200,
        height: 630,
        alt: "PT Brilian Eka Saetama",
      },
    ],
    type: "website",
  },
  icons: {
    icon: "/images/favicon.ico",
    apple: "/images/favicon.ico",
    other: [
      {
        rel: "apple-touch-icon",
        url: "/images/favicon.ico",
      },
    ],
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
