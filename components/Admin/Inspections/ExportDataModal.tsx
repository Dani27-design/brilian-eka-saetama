"use client";

import { useState, memo } from "react";
import Modal from "@/components/Admin/Modal";
import {
  exportToExcel,
  exportToCSV,
  validateExportData,
} from "@/utils/exportInspection";

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
  filteredInspections: ExportInspectionRow[];
  filterProductType: string;
  filterStatus: string;
  fetchInspectionsForExport: (startDate?: Date, endDate?: Date) => Promise<ExportInspectionRow[]>;
  onError: (message: string) => void;
}

function ExportDataModal({
  isOpen,
  onClose,
  filteredInspections,
  filterProductType,
  filterStatus,
  fetchInspectionsForExport,
  onError,
}: ExportDataModalProps) {
  const [exportFormat, setExportFormat] = useState<"excel" | "csv">("excel");
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState("");

  const handleExport = async (format: "excel" | "csv") => {
    setExportLoading(true);
    setExportProgress(`Memulai export ${format === "excel" ? "Excel" : "CSV"}...`);

    try {
      let dataToExport: ExportInspectionRow[];

      if (exportDateFrom || exportDateTo) {
        const startDate = exportDateFrom ? new Date(exportDateFrom) : undefined;
        const endDate = exportDateTo ? new Date(exportDateTo + "T23:59:59") : undefined;
        setExportProgress("Mengambil data dari database...");
        dataToExport = await fetchInspectionsForExport(startDate, endDate);
      } else {
        dataToExport = filteredInspections;
      }

      if (dataToExport.length === 0) {
        onError("Tidak ada data inspeksi untuk diekspor dalam rentang tanggal yang dipilih");
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

      setExportProgress(`Membuat file ${format === "excel" ? "Excel" : "CSV"} dengan ${dataToExport.length} data...`);

      if (format === "excel") {
        await exportToExcel(dataToExport, filename);
      } else {
        await exportToCSV(dataToExport, filename);
      }

      setExportProgress(`${format === "excel" ? "Excel" : "CSV"} berhasil diunduh!`);
    } catch (error: any) {
      console.error("Export error:", error instanceof Error ? error.message : "Unknown error");
      onError(error.message || `Gagal mengekspor data`);
    } finally {
      setExportLoading(false);
      setExportProgress("");
    }
  };

  const handleModalExport = async () => {
    onClose();
    await handleExport(exportFormat);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Data Inspeksi">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">
            Pilih format file dan rentang tanggal untuk mengekspor data inspeksi.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">Format Export</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="radio" value="excel" checked={exportFormat === "excel"}
                onChange={(e) => setExportFormat(e.target.value as "excel" | "csv")}
                className="mr-2 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm">Excel (.xlsx) - Recommended untuk analisis data</span>
            </label>
            <label className="flex items-center">
              <input type="radio" value="csv" checked={exportFormat === "csv"}
                onChange={(e) => setExportFormat(e.target.value as "excel" | "csv")}
                className="mr-2 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm">CSV (.csv) - Universal format untuk sistem lain</span>
            </label>
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
            <p className="text-blue-600">Format: {exportFormat === "excel" ? "Excel (.xlsx)" : "CSV (.csv)"}</p>
            {(exportDateFrom || exportDateTo) ? (
              <p className="text-blue-600">Data akan diambil dari database berdasarkan rentang tanggal yang dipilih</p>
            ) : (
              <p className="text-blue-600">Tanpa filter tanggal, akan menggunakan data halaman saat ini: {filteredInspections.length} inspeksi</p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Batal
          </button>
          <button onClick={handleModalExport} disabled={exportLoading}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              exportFormat === "excel" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
            } disabled:opacity-50`}>
            {exportLoading ? "Processing..." : exportFormat === "excel" ? "Export Excel" : "Export CSV"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default memo(ExportDataModal);
