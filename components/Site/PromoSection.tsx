"use client";

import { useLanguage } from "@/app/context/LanguageContext";

type PromoVariant = "services" | "trust" | "urgent";

const translations = {
  id: {
    services: {
      title: "Butuh Inspeksi Peralatan Kebakaran?",
      desc: "PT Brilian Eka Saetama menyediakan layanan inspeksi, perawatan, dan sertifikasi APAR, Hydrant, Fire Alarm, CCTV, dan Access Door untuk menjaga keamanan gedung Anda.",
      tagline: "Inspeksi profesional, terpercaya, dan bersertifikat",
      button: "Hubungi Kami",
    },
    trust: {
      title: "Dipercaya oleh Banyak Perusahaan",
      desc: "PT Brilian Eka Saetama telah melayani inspeksi dan perawatan peralatan keselamatan kebakaran untuk berbagai gedung perkantoran, pabrik, dan fasilitas komersial di Indonesia.",
      tagline: "Mitra keamanan gedung Anda yang terpercaya",
      button: "Konsultasi Gratis",
    },
    urgent: {
      title: "Jadwalkan Inspeksi Keamanan Gedung Anda",
      desc: "Pastikan peralatan keselamatan kebakaran Anda berfungsi optimal. Dapatkan inspeksi profesional dan sertifikat resmi dari tim ahli kami.",
      tagline: "Jangan tunggu sampai terlambat",
      button: "Hubungi Kami Sekarang",
    },
  },
  en: {
    services: {
      title: "Need Fire Safety Equipment Inspection?",
      desc: "PT Brilian Eka Saetama provides professional inspection, maintenance, and certification services for fire extinguishers, hydrants, fire alarms, CCTV, and access doors.",
      tagline: "Professional, trusted, and certified inspections",
      button: "Contact Us",
    },
    trust: {
      title: "Trusted by Many Companies",
      desc: "PT Brilian Eka Saetama has been serving fire safety equipment inspection and maintenance for offices, factories, and commercial facilities across Indonesia.",
      tagline: "Your trusted building safety partner",
      button: "Free Consultation",
    },
    urgent: {
      title: "Schedule Your Building Safety Inspection",
      desc: "Ensure your fire safety equipment is working optimally. Get professional inspections and official certificates from our expert team.",
      tagline: "Don't wait until it's too late",
      button: "Contact Us Now",
    },
  },
};

interface PromoSectionProps {
  variant?: PromoVariant;
  className?: string;
  vertical?: boolean;
}

export default function PromoSection({ variant = "services", className = "", vertical = false }: PromoSectionProps) {
  const { language } = useLanguage();
  const lang = translations[language as keyof typeof translations] || translations.id;
  const t = lang[variant];

  if (vertical) {
    return (
      <div className={`overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 ${className}`}>
        <div className="px-4 py-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t.title}</h3>
          <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">{t.desc}</p>
          <p className="mt-2 text-[10px] italic text-gray-500 dark:text-gray-400">{t.tagline}</p>
          <a
            href="/#contactus"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-primary/90"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {t.button}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 ${className}`}>
      <div className="px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{t.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-gray-600 dark:text-gray-300 sm:text-sm">{t.desc}</p>
            <p className="mt-2 text-[10px] italic text-gray-500 dark:text-gray-400">{t.tagline}</p>
          </div>
          <a
            href="/#contactus"
            className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {t.button}
          </a>
        </div>
      </div>
    </div>
  );
}
