"use client";

import { useState } from "react";
import { ProductType } from "@/types/product";
import { MaintenanceStatus } from "@/types/maintenances";

export interface InspectionFilters {
  search: string;
  productType: ProductType | "";
  status: MaintenanceStatus | "";
  dateFrom: string;
  dateTo: string;
  sortBy: "inspectionDate" | "contractNumber" | "productNumber" | "status";
  sortOrder: "asc" | "desc";
}

interface InspectionFiltersProps {
  filters: InspectionFilters;
  onFiltersChange: (filters: InspectionFilters) => void;
  onClearFilters: () => void;
  inspectionCount: number;
  filteredCount: number;
  onExportData: () => void;
  onExportCertificate: () => void;
  fixedProductType?: ProductType;
}

const inputBaseClass = "h-10 w-full rounded-lg border border-stroke bg-white px-4 text-sm outline-none transition-colors focus:border-primary";
const selectBaseClass = "h-10 w-full rounded-lg border border-stroke bg-white px-4 text-sm outline-none transition-colors focus:border-primary";
const buttonPrimaryClass = "inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90";
const buttonOutlineClass = "inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50";
const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

const productTypeDisplayNames: Record<ProductType, string> = {
  APAR: "APAR",
  HYDRANT: "Hydrant",
  CCTV: "CCTV",
  FIRE_ALARM: "Fire Alarm",
  ACCESS_DOOR: "Access Door",
  PATROL_GUARD: "Patrol Guard",
};

const statusDisplayNames: Record<MaintenanceStatus, string> = {
  pending: "Tertunda",
  scheduled: "Dijadwalkan",
  in_progress: "Sedang Dikerjakan",
  waiting_approval: "Menunggu Disetujui",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const allProductTypes: ProductType[] = [
  "APAR",
  "HYDRANT",
  "CCTV",
  "FIRE_ALARM",
  "ACCESS_DOOR",
  "PATROL_GUARD",
];

export default function InspectionFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  inspectionCount,
  filteredCount,
  onExportData,
  onExportCertificate,
  fixedProductType,
}: InspectionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if any filters are active (excluding search and default values)
  const hasActiveFilters =
    (!fixedProductType && filters.productType !== "" && filters.productType !== "APAR") ||
    filters.status !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    filters.sortBy !== "inspectionDate" ||
    filters.sortOrder !== "desc";

  const handleFilterChange = (key: keyof InspectionFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="space-y-3">
      {/* Search and Actions */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Cari berdasarkan kontrak, produk, atau teknisi"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className={`${inputBaseClass} pl-10`}
          />
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Export Data */}
          <button onClick={onExportData} className={buttonOutlineClass}>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
              />
            </svg>
            Ekspor Data
          </button>

          {/* Export Certificate */}
          <button onClick={onExportCertificate} className={buttonOutlineClass}>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Ekspor Sertifikat
          </button>

          {/* Filter Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={buttonOutlineClass}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 16 16"
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="m8.5 8.379l.44-.44l4.56-4.56V2.5h-11v.879l4.56 4.56l.44.44v4l1-1v-3ZM10 12l-2.5 2.5L6 16V9L1.293 4.293A1 1 0 0 1 1 3.586V2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1.586a1 1 0 0 1-.293.707L10 9v3Z"
                clipRule="evenodd"
              />
            </svg>
            Filter
            {hasActiveFilters && (
              <span className="flex h-2 w-2 rounded-full bg-primary"></span>
            )}
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button onClick={onClearFilters} className={buttonOutlineClass}>
              Hapus Filter
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="rounded-lg border border-stroke bg-white p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Product Type Filter — hidden when fixedProductType is set */}
            {!fixedProductType && (
              <div>
                <label className={labelClass}>Jenis Produk</label>
                <select
                  value={filters.productType}
                  onChange={(e) => handleFilterChange("productType", e.target.value)}
                  className={selectBaseClass}
                >
                  <option value="">Semua Jenis</option>
                  {allProductTypes.map((type) => (
                    <option key={type} value={type}>
                      {productTypeDisplayNames[type]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className={selectBaseClass}
              >
                <option value="">Semua Status</option>
                {Object.entries(statusDisplayNames).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From Filter */}
            <div>
              <label className={labelClass}>Dari Tanggal</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className={`${inputBaseClass} [color-scheme:light]`}
              />
            </div>

            {/* Date To Filter */}
            <div>
              <label className={labelClass}>Sampai Tanggal</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className={`${inputBaseClass} [color-scheme:light]`}
              />
            </div>
          </div>

          {/* Sorting */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Urutkan Berdasarkan</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className={selectBaseClass}
              >
                <option value="inspectionDate">Tanggal Inspeksi</option>
                <option value="contractNumber">Nomor Kontrak</option>
                <option value="productNumber">Nomor Produk</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Urutan</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
                className={selectBaseClass}
              >
                <option value="desc">Terbaru ke Terlama</option>
                <option value="asc">Terlama ke Terbaru</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
