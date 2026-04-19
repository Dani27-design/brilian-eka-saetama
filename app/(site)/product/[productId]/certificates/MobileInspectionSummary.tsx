"use client";

import { PublicCertificateData } from "./PublicCertificatesClient";
import { useLanguage } from "@/app/context/LanguageContext";

const translations = {
  id: {
    passRate: "Kelulusan",
    totalItems: "Total Item",
    passed: "Lolos",
    failed: "Tidak Lolos",
    issueDate: "Tgl. Terbit",
    validUntil: "Berlaku s/d",
    inspectionDate: "Tgl. Inspeksi",
    engineer: "Petugas",
    approvedBy: "Disetujui Oleh",
    location: "Lokasi",
  },
  en: {
    passRate: "Pass Rate",
    totalItems: "Total Items",
    passed: "Passed",
    failed: "Failed",
    issueDate: "Issue Date",
    validUntil: "Valid Until",
    inspectionDate: "Inspection Date",
    engineer: "Engineer",
    approvedBy: "Approved By",
    location: "Location",
  },
};

interface MobileInspectionSummaryProps {
  certificate: PublicCertificateData;
  checklist: any[];
  productType: string;
}

export function MobileInspectionSummary({ certificate, checklist, productType }: MobileInspectionSummaryProps) {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.id;
  const { checklistSummary } = certificate;
  const passRate = checklistSummary.passRate;
  const passColor = passRate >= 90 ? "text-green-600" : passRate >= 70 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="space-y-4">
      {/* Pass Rate + Stats */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t.passRate}</span>
          <span className={`text-2xl font-bold ${passColor}`}>{passRate}%</span>
        </div>
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
          <div
            className={`h-2 rounded-full transition-all ${passRate >= 90 ? "bg-green-500" : passRate >= 70 ? "bg-yellow-500" : "bg-red-500"}`}
            style={{ width: `${passRate}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{checklistSummary.totalItems}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">{t.totalItems}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">{checklistSummary.passedItems}</div>
            <div className="text-[10px] text-green-600 dark:text-green-400">{t.passed}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">{checklistSummary.failedItems}</div>
            <div className="text-[10px] text-red-600 dark:text-red-400">{t.failed}</div>
          </div>
        </div>
      </div>

      {/* Certificate Details */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t.issueDate}</span>
            <span className="font-medium text-gray-900 dark:text-white">{certificate.issueDate}</span>
          </div>
          {certificate.validUntil && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t.validUntil}</span>
              <span className="font-medium text-gray-900 dark:text-white">{certificate.validUntil}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t.inspectionDate}</span>
            <span className="font-medium text-gray-900 dark:text-white">{certificate.inspectionDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t.engineer}</span>
            <span className="font-medium text-gray-900 dark:text-white text-right break-words">
              {certificate.engineerNames.join(", ")}
            </span>
          </div>
          {certificate.resolvedApproverName && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t.approvedBy}</span>
              <span className="font-medium text-gray-900 dark:text-white">{certificate.resolvedApproverName}</span>
            </div>
          )}
          {certificate.resolvedLocation && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t.location}</span>
              <span className="font-medium text-gray-900 dark:text-white text-right break-words">
                {certificate.resolvedLocation}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
