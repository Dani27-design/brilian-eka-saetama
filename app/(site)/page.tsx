import { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { cookies } from "next/headers";

// Import critical components directly instead of lazy-loading
import Hero from "@/components/Hero";
import Services from "@/components/OurServices";

// Simple loading components with proper ARIA attributes
const SectionLoader = () => (
  <div
    className="w-full animate-pulse py-12"
    aria-label="Loading content"
    role="status"
  >
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
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);

// Lazy load below-fold components only
const About = dynamic(() => import("@/components/About"), {
  loading: () => <SectionLoader />,
  ssr: true,
});

const OurClients = dynamic(() => import("@/components/OurClients"), {
  loading: () => <SectionLoader />,
  ssr: true,
});

const ClientsInfo = dynamic(() => import("@/components/OurClientsInfo"), {
  loading: () => <SectionLoader />,
  ssr: true,
});

const FAQ = dynamic(() => import("@/components/FAQ"), {
  loading: () => <SectionLoader />,
  ssr: true, // Important for SEO - FAQ schema
});

const Testimonial = dynamic(() => import("@/components/Testimonial"), {
  loading: () => <SectionLoader />,
  ssr: true, // Important for social proof in SEO
});

const Contact = dynamic(() => import("@/components/Contact"), {
  loading: () => <SectionLoader />,
  ssr: true,
});

const Blog = dynamic(() => import("@/components/Blog"), {
  loading: () => <SectionLoader />,
  ssr: true,
});

// Comprehensive metadata with all necessary SEO elements
export const metadata: Metadata = {
  title: "PT Brilian Eka Saetama | Solusi Keamanan Kebakaran Terpercaya",
  description:
    "Kami adalah perusahaan terpercaya yang bergerak di bidang jasa instalasi dan pemeliharaan sistem proteksi kebakaran dan keamanan. Layanan kami mencakup pemasangan dan perawatan Hydrant, Fire Alarm System, CCTV, Door Access Control System, hingga Patrol Guard System.",
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
      "Kami adalah perusahaan terpercaya yang bergerak di bidang jasa instalasi dan pemeliharaan sistem proteksi kebakaran dan keamanan. Layanan kami mencakup pemasangan dan perawatan Hydrant, Fire Alarm System, CCTV, Door Access Control System, hingga Patrol Guard System.",
    siteName: "PT Brilian Eka Saetama",
    images: [
      {
        url: "https://brilian-eka-saetama.vercel.app/images/logo/logo-light.png",
        secureUrl:
          "https://brilian-eka-saetama.vercel.app/images/logo/logo-light.png",
        width: 1200,
        height: 630,
        alt: "PT Brilian Eka Saetama Logo",
        type: "image/png",
      },
    ],
    locale: "id_ID",
    type: "website",
    url: "https://brilian-eka-saetama.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "PT Brilian Eka Saetama | Solusi Keamanan Kebakaran Terpercaya",
    description:
      "Kami adalah perusahaan terpercaya yang bergerak di bidang jasa instalasi dan pemeliharaan sistem proteksi kebakaran dan keamanan. Layanan kami mencakup pemasangan dan perawatan Hydrant, Fire Alarm System, CCTV, Door Access Control System, hingga Patrol Guard System.",
    images: [
      "https://brilian-eka-saetama.vercel.app/images/logo/logo-light.png",
    ],
    site: "@ptbrilianekasaetama",
    creator: "@ptbrilianekasaetama",
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
  // Get language from cookies on the server
  const cookieStore = cookies();
  const langCookie = cookieStore.get("NEXT_LOCALE");
  const language = langCookie?.value || "id";

  return (
    <main className="min-h-screen w-full overflow-x-hidden">
      {/* Render critical above-fold content immediately */}
      <section
        data-section-name="hero"
        aria-labelledby="hero-heading"
        className="my-0 py-0"
      >
        <h2 id="hero-heading" className="sr-only">
          Solusi Keamanan Kebakaran Terpercaya
        </h2>
        <Hero language={language} />
      </section>

      <section
        data-section-name="services"
        aria-labelledby="services-heading"
        className="my-0 py-0"
      >
        <h2 id="services-heading" className="sr-only">
          Layanan Kami
        </h2>
        <Services />
      </section>

      {/* Continue to lazy load below-fold content */}
      <Suspense fallback={<SectionLoader />}>
        <section
          className="lazy-section my-0 py-0"
          data-section-name="about"
          aria-labelledby="about-heading"
        >
          <h2 id="about-heading" className="sr-only">
            Tentang Kami
          </h2>
          <About />
        </section>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <section
          className="lazy-section my-0 py-0"
          data-section-name="clients"
          aria-labelledby="clients-heading"
        >
          <h2 id="clients-heading" className="sr-only">
            Klien Kami
          </h2>
          <OurClients />
        </section>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <section
          className="lazy-section my-0 py-0"
          data-section-name="clients-info"
          aria-labelledby="clients-info-heading"
        >
          <h2 id="clients-info-heading" className="sr-only">
            Informasi Klien
          </h2>
          <ClientsInfo />
        </section>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <section
          className="lazy-section my-0 py-0"
          data-section-name="faq"
          aria-labelledby="faq-heading"
        >
          <h2 id="faq-heading" className="sr-only">
            Pertanyaan yang Sering Diajukan
          </h2>
          <FAQ />
        </section>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <section
          className="lazy-section my-0 py-0"
          data-section-name="testimonial"
          aria-labelledby="testimonial-heading"
        >
          <h2 id="testimonial-heading" className="sr-only">
            Testimonial
          </h2>
          <Testimonial />
        </section>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <section
          className="lazy-section my-0 py-0"
          data-section-name="contact"
          aria-labelledby="contact-heading"
        >
          <h2 id="contact-heading" className="sr-only">
            Hubungi Kami
          </h2>
          <Contact />
        </section>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <section
          className="lazy-section my-0 py-0"
          data-section-name="blog"
          aria-labelledby="blog-heading"
        >
          <h2 id="blog-heading" className="sr-only">
            Blog
          </h2>
          <Blog />
        </section>
      </Suspense>
    </main>
  );
}
