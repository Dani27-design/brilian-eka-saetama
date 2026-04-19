"use client";

import { useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";

const translations = {
  id: {
    noChecklist: "Belum Ada Data Checklist",
    noChecklistDesc: "Data checklist inspeksi belum tersedia untuk sertifikat ini.",
    passed: "Lolos",
    failed: "Tidak Lolos",
    total: "Total",
    remarks: "Catatan",
    showRemarks: "Lihat Catatan",
    hideRemarks: "Tutup",
    ok: "BAIK",
    nok: "TIDAK BAIK",
  },
  en: {
    noChecklist: "No Checklist Data",
    noChecklistDesc: "Inspection checklist is not available for this certificate.",
    passed: "Passed",
    failed: "Failed",
    total: "Total",
    remarks: "Remarks",
    showRemarks: "View Remarks",
    hideRemarks: "Hide",
    ok: "OK",
    nok: "NOT OK",
  },
};

interface ChecklistItem {
  item: string;
  detail?: string;
  status: boolean;
  remarks?: string;
}

interface MobileInspectionChecklistProps {
  checklist: ChecklistItem[];
  productType: string;
}

export function MobileInspectionChecklist({ checklist, productType }: MobileInspectionChecklistProps) {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.id;
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  if (!checklist || checklist.length === 0) {
    return (
      <div className="py-8 text-center">
        <svg className="mx-auto mb-2 h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t.noChecklist}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t.noChecklistDesc}</p>
      </div>
    );
  }

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const passedItems = checklist.filter(item => item.status).length;
  const failedItems = checklist.length - passedItems;

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          {passedItems} {t.passed}
        </span>
        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          {failedItems} {t.failed}
        </span>
        <span className="text-gray-400 dark:text-gray-500">·</span>
        <span className="text-gray-500 dark:text-gray-400">{checklist.length} {t.total}</span>
      </div>

      {/* Items */}
      {checklist.map((item, index) => {
        const isExpanded = expandedItems.has(index);
        const hasRemarks = item.remarks && item.remarks.trim().length > 0;

        return (
          <div
            key={index}
            className={`rounded-lg border p-3 ${
              item.status ? "border-green-200 dark:border-green-800 bg-white dark:bg-gray-800" : "border-red-200 dark:border-red-800 bg-white dark:bg-gray-800"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {/* Status icon */}
              <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] text-white ${
                item.status ? "bg-green-500" : "bg-red-500"
              }`}>
                {item.status ? "✓" : "✗"}
              </div>

              <div className="min-w-0 flex-1">
                {/* Item name */}
                <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                  {item.detail || item.item}
                </p>

                {/* Status badge + remarks toggle */}
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    item.status ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  }`}>
                    {item.status ? t.ok : t.nok}
                  </span>
                  {hasRemarks && (
                    <button
                      onClick={() => toggleExpand(index)}
                      className="text-[10px] font-medium text-primary"
                    >
                      {isExpanded ? t.hideRemarks : t.showRemarks}
                    </button>
                  )}
                </div>

                {/* Remarks */}
                {hasRemarks && isExpanded && (
                  <div className="mt-2 rounded-md border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2">
                    <p className="text-xs text-gray-600 dark:text-gray-300 break-words">{item.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
