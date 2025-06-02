import React from "react";

export default function SchemaMarkup() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://brilian-eka-saetama.vercel.app/#organization",
    name: "PT Brilian Eka Saetama",
    alternateName: "PT BES",
    url: "https://brilian-eka-saetama.vercel.app",
    logo: {
      "@type": "ImageObject",
      url: "https://brilian-eka-saetama.vercel.app/images/logo/logo-light.png",
      width: "180",
      height: "180",
    },
    image: [
      "https://brilian-eka-saetama.vercel.app/images/logo/logo-light.png",
    ],
    email: "ptbrilianekasaetama@gmail.com",
    description:
      "PT. Brilian Eka Saetama (BES) adalah perusahaan yang bergerak di bidang jasa instalasi dan pemeliharaan sistem proteksi kebakaran dan keamanan. Layanan kami mencakup pemasangan dan perawatan Hydrant, Fire Alarm System, CCTV, Door Access Control System, hingga Patrol Guard System.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Sidoarjo",
      addressRegion: "Kabupaten Sidoarjo",
      addressCountry: "ID",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:00",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+62-857-9042-8078",
      contactType: "customer service",
    },
    sameAs: ["https://www.instagram.com/pt_brilian"],
    areaServed: ["Jawa Timur", "Indonesia"],
    slogan: "Solusi Keamanan Kebakaran Terpercaya",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
