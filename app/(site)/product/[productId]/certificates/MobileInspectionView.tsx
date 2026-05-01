"use client";

import { useState } from "react";
import { PublicCertificateData } from "./PublicCertificatesClient";
import { MobileInspectionChecklist } from "./MobileInspectionChecklist";
import { MobilePhotoGallery } from "./MobilePhotoGallery";
import { MobileInspectionSummary } from "./MobileInspectionSummary";
import { useLanguage } from "@/app/context/LanguageContext";

const translations = {
  id: {
    summary: "Ringkasan",
    checklist: "Checklist",
    photos: "Foto",
    downloadCertificate: "Unduh Sertifikat",
    approved: "Disetujui",
  },
  en: {
    summary: "Summary",
    checklist: "Checklist",
    photos: "Photos",
    downloadCertificate: "Download Certificate",
    approved: "Approved",
  },
};

interface MobileInspectionViewProps {
  certificate: PublicCertificateData;
  downloadUrl: string;
}

export function MobileInspectionView({
  certificate,
  downloadUrl,
}: MobileInspectionViewProps) {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.id;
  const [activeSection, setActiveSection] = useState<
    "summary" | "checklist" | "photos"
  >("summary");

  const inspectionData = certificate.rawMaintenanceData?.inspection;
  const checklist = inspectionData?.checklist || [];
  const productType = certificate.rawMaintenanceData?.productType;

  // APAR/CCTV/ACCESS_DOOR/PATROL_GUARD: inspection-level photos
  // HYDRANT/FIRE_ALARM: per-checklist-item photos
  const photos = (() => {
    const inspectionPhotos = inspectionData?.photos || [];
    if (inspectionPhotos.length > 0) return inspectionPhotos;
    const itemPhotos = checklist.reduce((all: string[], item: any) => {
      if (item.photos && Array.isArray(item.photos)) return [...all, ...item.photos];
      return all;
    }, []);
    return itemPhotos;
  })();

  return (
    <div className="p-4">
      {/* Download Button — top, prominent */}
      <a
        href={downloadUrl}
        download={`${certificate.certificateNumber}.pdf`}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-white hover:bg-primary/90"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {t.downloadCertificate}
      </a>

      {/* Status + Date */}
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
          ✓ {t.approved}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{certificate.inspectionDate}</span>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
        {[
          { id: "summary", label: t.summary },
          { id: "checklist", label: t.checklist },
          { id: "photos", label: `${t.photos} (${photos.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
              activeSection === tab.id
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm dark:shadow-gray-900/20"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {activeSection === "summary" && (
          <MobileInspectionSummary
            certificate={certificate}
            checklist={checklist}
            productType={productType}
          />
        )}
        {activeSection === "checklist" && (
          <MobileInspectionChecklist
            checklist={checklist}
            productType={productType}
          />
        )}
        {activeSection === "photos" && (
          <MobilePhotoGallery
            photos={photos}
            certificateNumber={certificate.certificateNumber}
          />
        )}
      </div>
    </div>
  );
}
