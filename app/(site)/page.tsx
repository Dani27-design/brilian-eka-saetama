import { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// Simple loading components
const SectionLoader = () => (
  <div className="w-full animate-pulse py-12">
    <div className="container mx-auto">
      <div className="mb-8 h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="mb-4 h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="mb-12 h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-64 rounded bg-gray-200 dark:bg-gray-700"
          ></div>
        ))}
      </div>
    </div>
  </div>
);

// Lazy load below-fold components
const Hero = dynamic(() => import("@/components/Hero"), {
  loading: () => <SectionLoader />,
  ssr: true,
});

const Services = dynamic(() => import("@/components/OurServices"), {
  loading: () => <SectionLoader />,
  ssr: true,
});

const About = dynamic(() => import("@/components/About"), {
  loading: () => <SectionLoader />,
  ssr: true,
});

const OurClients = dynamic(() => import("@/components/OurClients"), {
  loading: () => <SectionLoader />,
  ssr: false, // Not critical for initial SSR
});

const ClientsInfo = dynamic(() => import("@/components/OurClientsInfo"), {
  loading: () => <SectionLoader />,
  ssr: false,
});

const FAQ = dynamic(() => import("@/components/FAQ"), {
  loading: () => <SectionLoader />,
  ssr: false,
});

const Testimonial = dynamic(() => import("@/components/Testimonial"), {
  loading: () => <SectionLoader />,
  ssr: false,
});

const Contact = dynamic(() => import("@/components/Contact"), {
  loading: () => <SectionLoader />,
  ssr: true, // Important for SEO, so keep SSR
});

const Blog = dynamic(() => import("@/components/Blog"), {
  loading: () => <SectionLoader />,
  ssr: true, // Important for SEO, so keep SSR
});

// Keep your existing metadata
export const metadata: Metadata = {
  title: "PT Brilian Eka Saetama | Solusi Keamanan Kebakaran Terpercaya",
  description:
    "Kami adalah perusahaan yang bergerak di bidang jasa instalasi dan pemeliharaan sistem proteksi kebakaran dan keamanan. Layanan kami mencakup pemasangan dan perawatan Hydrant, Fire Alarm System, CCTV, Door Access Control System, hingga Patrol Guard System.",
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
    "brilian eka saetama bes",
    "pt bes",
    "bes",
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
    "patrol guard system",
    "door access control system",
    "cctv",
    "proteksi kebakaran",
    "instalasi hydrant",
    "jasa fire safety",
    "konsultan kebakaran",
    "pemeliharaan sistem proteksi kebakaran",
    "pemasangan fire alarm",
    "pemasangan hydrant",
    "pemasangan sprinkler",
    "pemasangan smoke detector",
    "pemasangan fire extinguisher",
    "pemasangan sistem proteksi kebakaran",
    "pemasangan Door Access Control System",
    "pemasangan CCTV",
    "pemasangan Patrol Guard System",
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
      "Kami adalah perusahaan yang bergerak di bidang jasa instalasi dan pemeliharaan sistem proteksi kebakaran dan keamanan. Layanan kami mencakup pemasangan dan perawatan Hydrant, Fire Alarm System, CCTV, Door Access Control System, hingga Patrol Guard System.",
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
      "Kami adalah perusahaan yang bergerak di bidang jasa instalasi dan pemeliharaan sistem proteksi kebakaran dan keamanan. Layanan kami mencakup pemasangan dan perawatan Hydrant, Fire Alarm System, CCTV, Door Access Control System, hingga Patrol Guard System.",
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
  metadataBase: new URL("https://brilian-eka-saetama.vercel.app"),
};

export default function Home() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden">
      <Suspense fallback={<SectionLoader />}>
        <section className="lazy-section" data-section-name="hero">
          <Hero />
        </section>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <section className="lazy-section" data-section-name="services">
          <Services />
        </section>
      </Suspense>

      {/* Add intersection observer based lazy loading for below-fold content */}
      <Suspense fallback={<SectionLoader />}>
        <section className="lazy-section" data-section-name="about">
          <About />
        </section>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <section className="lazy-section" data-section-name="clients">
          <OurClients />
        </section>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <section className="lazy-section" data-section-name="clients-info">
          <ClientsInfo />
        </section>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <section className="lazy-section" data-section-name="faq">
          <FAQ />
        </section>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <section className="lazy-section" data-section-name="testimonial">
          <Testimonial />
        </section>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <section className="lazy-section" data-section-name="contact">
          <Contact />
        </section>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <section className="lazy-section" data-section-name="blog">
          <Blog />
        </section>
      </Suspense>
    </main>
  );
}
