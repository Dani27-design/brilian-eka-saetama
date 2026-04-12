"use client";

import { useState, memo } from "react";
import Modal from "@/components/Admin/Modal";
import {
  exportInspections,
  validateExportData,
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
}

function ExportDataModal({
  isOpen,
  onClose,
  allInspections,
  filteredInspections,
  filterProductType,
  filterStatus,
  onError,
}: ExportDataModalProps) {
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState("");

  const isVerticalFormat = filterProductType === "HYDRANT" || filterProductType === "FIRE_ALARM";
  const productLabel = filterProductType === "HYDRANT" ? "Hydrant" : filterProductType === "FIRE_ALARM" ? "Fire Alarm" : "APAR";

  const handleExport = async () => {
    setExportLoading(true);
    setExportProgress("Memulai export Excel...");

    try {
      let dataToExport: ExportInspectionRow[];

      if (exportDateFrom || exportDateTo) {
        // Filter the already-loaded data by date range (client-side)
        // Use inspectionDateRaw (JS Date) — not inspectionDate (Indonesian formatted string)
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
        // No date range — use current page-filtered data
        dataToExport = filteredInspections;
      }

      if (dataToExport.length === 0) {
        onError(
          exportDateFrom || exportDateTo
            ? "Tidak ada data inspeksi untuk diekspor dalam rentang tanggal yang dipilih"
            : "Tidak ada data inspeksi untuk diekspor pada halaman saat ini",
        );
        return;
      }

      setExportProgress(`Memvalidasi ${dataToExport.length} data inspeksi...`);
      const validation = validateExportData(dataToExport);
      if (!validation.isValid) {
        onError(`Gagal ekspor: ${validation.errors.join(", ")}`);
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      let filename = `inspection_export_${today}`;
      if (filterProductType) filename += `_${filterProductType}`;
      if (filterStatus) filename += `_${filterStatus}`;
      if (exportDateFrom && exportDateTo) filename += `_${exportDateFrom}_to_${exportDateTo}`;

      if (isVerticalFormat) {
        setExportProgress(`Mengunduh ${dataToExport.length} file inspeksi ${productLabel}...`);
      } else {
        setExportProgress(`Membuat file Excel dengan ${dataToExport.length} data...`);
      }

      await exportInspections(
        dataToExport,
        filterProductType as ProductType,
        filename,
        (current, total) => {
          setExportProgress(`Mengunduh file ${current}/${total}...`);
        },
      );

      setExportProgress(
        isVerticalFormat
          ? `${dataToExport.length} file berhasil diunduh!`
          : "Excel berhasil diunduh!",
      );
    } catch (error: any) {
      console.error("Export error:", error instanceof Error ? error.message : "Unknown error");
      onError(error.message || "Gagal mengekspor data");
    } finally {
      setExportLoading(false);
      setExportProgress("");
    }
  };

  const handleModalExport = async () => {
    await handleExport();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Data Inspeksi">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">
            {isVerticalFormat
              ? `Export data inspeksi ${productLabel}. Setiap inspeksi akan diunduh sebagai file Excel terpisah dengan format vertikal.`
              : "Export data inspeksi APAR ke file Excel dengan semua data dalam satu tabel."}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">Format Export</label>
          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-800">
              {isVerticalFormat ? "Excel (.xlsx) — 1 file per inspeksi" : "Excel (.xlsx) — Tabel flat"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {isVerticalFormat
                ? `Setiap inspeksi ${productLabel} akan diunduh sebagai file terpisah dengan header vertikal dan tabel checklist.`
                : "Semua data inspeksi APAR ditampilkan dalam satu tabel dengan kolom checklist dan foto."}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
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
        </div>

        {exportLoading && exportProgress && (
          <div className="rounded-lg bg-blue-50 p-3 text-sm">
            <div className="flex items-center">
              <div className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600"></div>
              <p className="font-medium text-blue-800">{exportProgress}</p>
            </div>
          </div>
        )}

        {!exportLoading && (exportDateFrom || exportDateTo || filteredInspections.length > 0) && (
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <p className="font-medium text-gray-700">Informasi Export:</p>
            <p className="text-blue-600">
              {isVerticalFormat
                ? `Format: Excel — 1 file per inspeksi ${productLabel}`
                : "Format: Excel — Tabel flat (.xlsx)"}
            </p>
            {(exportDateFrom || exportDateTo) ? (
              <p className="text-blue-600">
                Data akan difilter berdasarkan rentang tanggal dari {allInspections.length} inspeksi yang tersedia
              </p>
            ) : (
              <p className="text-blue-600">
                Tanpa filter tanggal, akan menggunakan data halaman saat ini: {filteredInspections.length} inspeksi
                {isVerticalFormat ? ` (${filteredInspections.length} file)` : ""}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Batal
          </button>
          <button onClick={handleModalExport} disabled={exportLoading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
            {exportLoading ? "Processing..." : "Export Excel"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default memo(ExportDataModal);
