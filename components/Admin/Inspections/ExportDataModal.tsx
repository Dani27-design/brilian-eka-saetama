"use client";

import { useState, useEffect, memo } from "react";
import Modal from "@/components/Admin/Modal";
import {
  exportInspections,
  exportInspectionsCSV,
  exportInspectionsPDF,
  validateExportData,
  PDFExportOptions,
} from "@/utils/exportInspection";
import { ProductType } from "@/types/product";

export interface ExportInspectionRow {
  id: string;
  contractNumber: string;
  contractName: string;
  productNumber: string;
  productName: string;
  productBrand: string;
  brandType?: string;
  capacity?: string;
  productType: string;
  expirationDate: string;
  location: string;
  inspectionDate: string;
  inspectionDateRaw?: Date | null;
  inspectorName?: string;
  engineerNames: string[];
  checklistSummary: { totalItems: number; okCount: number; nokCount: number };
  checklistDetails: any;
  photos: string[];
  status: string;
  hasInspection: boolean;
  canApprove: boolean;
  maintenance: any;
}

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  allInspections: ExportInspectionRow[];
  filteredInspections: ExportInspectionRow[];
  filterProductType: string;
  filterStatus: string;
  onError: (message: string) => void;
  singleMode?: boolean;
}

function ExportDataModal({
  isOpen,
  onClose,
  allInspections,
  filteredInspections,
  filterProductType,
  filterStatus,
  onError,
  singleMode = false,
}: ExportDataModalProps) {
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [localWarning, setLocalWarning] = useState("");
  const [exportFormat, setExportFormat] = useState<"excel" | "csv" | "pdf">("excel");
  const [pdfShowLogo, setPdfShowLogo] = useState(true);
  const [pdfCustomTitle, setPdfCustomTitle] = useState("");

  const isVerticalFormat = filterProductType === "HYDRANT" || filterProductType === "FIRE_ALARM";
  const productLabel = filterProductType === "HYDRANT" ? "Hydrant" : filterProductType === "FIRE_ALARM" ? "Fire Alarm" : "APAR";

  // Build default title based on product type
  const getDefaultTitle = () => {
    if (filterProductType === "HYDRANT") {
      const firstInsp = allInspections[0];
      const brandType = firstInsp?.brandType || "";
      const suffix = brandType === "HPO" ? " PORTABLE" : brandType === "HPE" ? " PERMANENT" : "";
      return `MONITORING PELAKSANAAN PERAWATAN HYDRANT${suffix}`;
    }
    if (filterProductType === "FIRE_ALARM") return "MONITORING PELAKSANAAN PERAWATAN FIRE ALARM";
    return "MONITORING PELAKSANAAN PERAWATAN APAR";
  };
  const isSingleExport = singleMode;

  // Clear local warning when dates change or modal reopens
  useEffect(() => {
    setLocalWarning("");
  }, [exportDateFrom, exportDateTo, isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setExportDateFrom("");
      setExportDateTo("");
      setExportLoading(false);
      setExportProgress("");
      setLocalWarning("");
      setExportFormat("excel");
      setPdfShowLogo(true);
      setPdfCustomTitle("");
    }
  }, [isOpen]);

  const handleExport = async () => {
    setExportLoading(true);
    setExportProgress("Memulai export Excel...");
    setLocalWarning("");

    try {
      let dataToExport: ExportInspectionRow[];

      if (exportDateFrom || exportDateTo) {
        dataToExport = allInspections.filter((insp) => {
          if (!insp.inspectionDateRaw) return false;
          const inspTime = insp.inspectionDateRaw.getTime();
          if (isNaN(inspTime)) return false;
          if (exportDateFrom) {
            const from = new Date(exportDateFrom);
            from.setHours(0, 0, 0, 0);
            if (inspTime < from.getTime()) return false;
          }
          if (exportDateTo) {
            const to = new Date(exportDateTo);
            to.setHours(23, 59, 59, 999);
            if (inspTime > to.getTime()) return false;
          }
          return true;
        });
      } else {
        dataToExport = filteredInspections;
      }

      if (dataToExport.length === 0) {
        // Show detailed warning locally — don't propagate to parent
        const dateInfo = exportDateFrom || exportDateTo
          ? `Rentang tanggal: ${exportDateFrom || "awal"} — ${exportDateTo || "akhir"}`
          : "Tidak ada filter tanggal yang diterapkan";
        const totalInfo = `Total inspeksi ${productLabel} tersedia: ${allInspections.length}`;
        const suggestion = exportDateFrom || exportDateTo
          ? "Coba perluas rentang tanggal atau kosongkan filter tanggal untuk mengekspor semua data."
          : "Pastikan ada data inspeksi yang tersedia pada halaman saat ini.";

        setLocalWarning(
          `Tidak ditemukan data inspeksi untuk diekspor.\n\n${dateInfo}\n${totalInfo}\n\n${suggestion}`
        );
        setExportLoading(false);
        setExportProgress("");
        return;
      }

      setExportProgress(`Memvalidasi ${dataToExport.length} data inspeksi...`);
      const validation = validateExportData(dataToExport);
      if (!validation.isValid) {
        setLocalWarning(`Validasi gagal: ${validation.errors.join(", ")}`);
        setExportLoading(false);
        setExportProgress("");
        return;
      }

      const type = (filterProductType || "inspeksi").toLowerCase().replace(/_/g, "-");
      const dateRange = exportDateFrom && exportDateTo ? `${exportDateFrom}_${exportDateTo}` : new Date().toISOString().slice(0, 7);
      const filename = `laporan_inspeksi_${type}_${dateRange}`;

      const formatLabel = exportFormat === "csv" ? "CSV" : exportFormat === "pdf" ? "PDF" : "Excel";
      if (isVerticalFormat) {
        setExportProgress(`Mengunduh ${dataToExport.length} file ${formatLabel} inspeksi ${productLabel}...`);
      } else {
        setExportProgress(`Membuat file ${formatLabel} dengan ${dataToExport.length} data...`);
      }

      if (exportFormat === "csv") {
        await exportInspectionsCSV(dataToExport, filterProductType as ProductType, filename, (current, total) => {
          setExportProgress(`Mengunduh file ${current}/${total}...`);
        });
      } else if (exportFormat === "pdf") {
        const pdfOpts: PDFExportOptions = {
          showLogo: pdfShowLogo,
          customTitle: pdfCustomTitle || undefined,
        };
        await exportInspectionsPDF(dataToExport, filterProductType as ProductType, filename, (current, total) => {
          setExportProgress(`Mengunduh file ${current}/${total}...`);
        }, pdfOpts);
      } else {
        await exportInspections(dataToExport, filterProductType as ProductType, filename, (current, total) => {
          setExportProgress(`Mengunduh file ${current}/${total}...`);
        });
      }

      setExportProgress(
        isVerticalFormat
          ? `${dataToExport.length} file ${formatLabel} berhasil diunduh!`
          : `${formatLabel} berhasil diunduh!`
      );

      // Auto-close after successful export
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error("Export error:", error instanceof Error ? error.message : "Unknown error");
      onError(error.message || "Gagal mengekspor laporan");
      onClose();
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isSingleExport ? "Ekspor Laporan" : "Ekspor Laporan Inspeksi"} size={isSingleExport ? "md" : "lg"}>
      <div className="space-y-4">
        {isSingleExport ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-gray-500">Kontrak</span>
              <span className="font-medium text-gray-700">{allInspections[0]?.contractNumber}</span>
              <span className="text-gray-500">Produk</span>
              <span className="font-medium text-gray-700">{allInspections[0]?.productName} — {allInspections[0]?.productNumber}</span>
              <span className="text-gray-500">Tgl Inspeksi</span>
              <span className="font-medium text-gray-700">{allInspections[0]?.inspectionDate}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            {isVerticalFormat
              ? `Export data inspeksi ${productLabel}. Setiap inspeksi akan diunduh sebagai file terpisah.`
              : `Export data inspeksi ${productLabel} ke satu file.`}
          </p>
        )}

        {/* Local Warning — dismissible, detailed */}
        {localWarning && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="flex-1">
                {localWarning.split("\n").map((line, i) => (
                  <p key={i} className={`text-sm ${i === 0 ? "font-medium text-orange-800" : "text-orange-700"} ${line === "" ? "h-2" : ""}`}>
                    {line}
                  </p>
                ))}
              </div>
              <button
                onClick={() => setLocalWarning("")}
                className="flex-shrink-0 rounded-md p-1 text-orange-400 hover:bg-orange-100 hover:text-orange-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 p-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Format Ekspor</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "excel" as const, label: "Excel", ext: ".xlsx", desc: "Spreadsheet dengan tabel lengkap" },
              { value: "pdf" as const, label: "PDF", ext: ".pdf", desc: "Dokumen siap cetak" },
            ].map((fmt) => (
              <button
                key={fmt.value}
                type="button"
                onClick={() => setExportFormat(fmt.value)}
                className={`flex flex-col items-center rounded-lg border p-3 text-center transition-colors ${
                  exportFormat === fmt.value
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-sm font-medium text-gray-900">{fmt.label}</span>
                <span className="text-[10px] text-gray-400">{fmt.ext}</span>
                <span className="mt-1 text-[10px] text-gray-500">{fmt.desc}</span>
              </button>
            ))}
          </div>
          {isVerticalFormat && (
            <p className="mt-2 text-xs text-gray-500">
              {exportFormat === "excel" ? `Setiap inspeksi ${productLabel} akan diunduh sebagai file Excel terpisah.`
                : exportFormat === "csv" ? `Setiap inspeksi ${productLabel} akan diunduh sebagai file CSV terpisah.`
                : `Setiap inspeksi ${productLabel} akan diunduh sebagai file PDF terpisah.`}
            </p>
          )}
        </div>

        {/* PDF Customization — only visible when PDF selected */}
        {exportFormat === "pdf" && (
          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Pengaturan PDF</p>

            {/* Logo toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Tampilkan Logo Perusahaan</p>
                <p className="text-[10px] text-gray-400">Logo akan ditampilkan di kiri atas letterhead</p>
              </div>
              <button
                type="button"
                onClick={() => setPdfShowLogo(!pdfShowLogo)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  pdfShowLogo ? "bg-primary" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    pdfShowLogo ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Custom title */}
            <div>
              <label className="mb-1 block text-sm text-gray-700">Judul Letterhead</label>
              <input
                type="text"
                value={pdfCustomTitle}
                onChange={(e) => setPdfCustomTitle(e.target.value)}
                placeholder={getDefaultTitle()}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <p className="mt-1 text-[10px] text-gray-400">
                Kosongkan untuk menggunakan judul default
              </p>
            </div>
          </div>
        )}

        {!isSingleExport && (
          <div className="rounded-lg border border-gray-200 p-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">Rentang Tanggal (Opsional)</label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">Dari Tanggal</label>
                <input type="date" value={exportDateFrom}
                  onChange={(e) => setExportDateFrom(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="flex items-center justify-center text-sm text-gray-500 sm:px-3">sampai</div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">Sampai Tanggal</label>
                <input type="date" value={exportDateTo}
                  onChange={(e) => setExportDateTo(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Kosongkan untuk mengekspor semua data yang sedang ditampilkan ({filteredInspections.length} inspeksi)
            </p>
          </div>
        )}

        {exportLoading && exportProgress && (
          <div className="rounded-lg bg-blue-50 p-3 text-sm">
            <div className="flex items-center">
              <div className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600"></div>
              <p className="font-medium text-blue-800">{exportProgress}</p>
            </div>
          </div>
        )}

        {!exportLoading && !localWarning && !isSingleExport && (
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <p className="font-medium text-gray-700">Ringkasan:</p>
            <div className="mt-1 space-y-0.5 text-xs text-gray-600">
              <p>Tipe produk: <span className="font-medium">{productLabel}</span></p>
              <p>Total inspeksi tersedia: <span className="font-medium">{allInspections.length}</span></p>
              {(exportDateFrom || exportDateTo) ? (
                <p>Filter: <span className="font-medium">{exportDateFrom || "awal"} — {exportDateTo || "akhir"}</span></p>
              ) : (
                <p>Data yang akan diekspor: <span className="font-medium">{filteredInspections.length} inspeksi</span>
                  {isVerticalFormat ? ` (${filteredInspections.length} file)` : ""}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Batal
          </button>
          <button onClick={handleExport} disabled={exportLoading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
            {exportLoading ? "Memproses..." : `Ekspor ${exportFormat === "csv" ? "CSV" : exportFormat === "pdf" ? "PDF" : "Excel"}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default memo(ExportDataModal);
