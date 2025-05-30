import React from "react";

export default function SchemaMarkup() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PT Brilian Eka Saetama",
    url: "https://brilian-eka-saetama.vercel.app",
    logo: "https://brilian-eka-saetama.vercel.app/images/logo/logo-light.png",
    description:
      "PT. Brilian Eka Saetama (BES) menyediakan solusi keamanan dari bahaya kebakaran dengan standar kualitas terbaik.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Sidoarjo",
      addressRegion: "Kabupaten Sidoarjo",
      addressCountry: "ID",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+62-857-9042-8078",
      contactType: "customer service",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
