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
}

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
}: InspectionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if any filters are active (excluding search and default values)
  // Special: "APAR" is the default productType, so it does NOT count as active
  const hasActiveFilters =
    (filters.productType !== "" && filters.productType !== "APAR") ||
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
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Cari Inspeksi
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Nomor kontrak, produk..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full rounded-lg border border-stroke bg-white px-4 py-2 pl-10 outline-none focus:border-primary"
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
        </div>

        {/* Quick Filter Toggle and Results Count */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{filteredCount}</span> dari{" "}
            <span className="font-medium">{inspectionCount}</span> inspeksi
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <svg
              className={`h-4 w-4 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            Filter Lanjutan
            {hasActiveFilters && (
              <span className="flex h-2 w-2 rounded-full bg-orange-400"></span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="rounded-lg border border-stroke bg-gray-50 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Product Type Filter */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Jenis Produk
              </label>
              <select
                value={filters.productType}
                onChange={(e) => handleFilterChange("productType", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Semua Jenis</option>
                {allProductTypes.map((type) => (
                  <option key={type} value={type}>
                    {productTypeDisplayNames[type]}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary"
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
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none [color-scheme:light] focus:border-primary"
              />
            </div>

            {/* Date To Filter */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none [color-scheme:light] focus:border-primary"
              />
            </div>
          </div>

          {/* Sorting */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Urutkan Berdasarkan
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="inspectionDate">Tanggal Inspeksi</option>
                <option value="contractNumber">Nomor Kontrak</option>
                <option value="productNumber">Nomor Produk</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Urutan
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary"
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
