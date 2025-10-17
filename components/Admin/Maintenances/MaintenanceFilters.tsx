"use client";

import { useState } from "react";
import { MaintenanceStatus } from "@/types/maintenances";
import { ProductType } from "@/types/product";

export interface MaintenanceFilters {
  search: string;
  status: MaintenanceStatus | "";
  productType: ProductType | "";
  contractNumber: string;
  engineerId: string;
  month: number; // 1-12, 0 for all months
  year: number; // 0 for all years
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  hasInspection: "" | "yes" | "no";
  sortBy: "startDate" | "endDate" | "status" | "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
}

interface MaintenanceFiltersProps {
  filters: MaintenanceFilters;
  onFiltersChange: (filters: MaintenanceFilters) => void;
  onClearFilters: () => void;
  maintenanceCount: number;
  filteredCount: number;
  availableEngineers: Array<{ id: string; name: string }>;
  availableContracts: Array<{ id: string; contractNumber: string }>;
  availableProductTypes: ProductType[];
}

const statusDisplayNames: Record<MaintenanceStatus, string> = {
  scheduled: "Dijadwalkan",
  pending: "Tertunda",
  waiting_approval: "Menunggu Disetujui",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const productTypeDisplayNames: Record<ProductType, string> = {
  APAR: "APAR",
  HYDRANT: "Hydrant",
  CCTV: "CCTV",
  FIRE_ALARM: "Fire Alarm",
  ACCESS_DOOR: "Access Door",
  PATROL_GUARD: "Patrol Guard",
};

export default function MaintenanceFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  maintenanceCount,
  filteredCount,
  availableEngineers,
  availableContracts,
  availableProductTypes,
}: MaintenanceFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if any filters are active (excluding search, month filter, and default sort)
  // Month filter is excluded since it's prominently displayed and commonly used
  const hasActiveFilters =
    filters.status ||
    filters.productType ||
    filters.contractNumber ||
    filters.engineerId ||
    filters.year > 0 ||
    filters.dateRange.start ||
    filters.dateRange.end ||
    filters.hasInspection ||
    filters.sortBy !== "startDate" ||
    filters.sortOrder !== "asc";

  const handleFilterChange = (key: keyof MaintenanceFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleDateRangeChange = (field: "start" | "end", value: string) => {
    const dateValue = value ? new Date(value) : null;
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: dateValue,
      },
    });
  };

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return "";
    return date.toISOString().slice(0, 10);
  };

  const getCurrentYear = () => new Date().getFullYear();
  const getYearRange = () => {
    const currentYear = getCurrentYear();
    const years: number[] = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  };

  return (
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search and Month Filter */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          {/* Search */}
          <div className="flex-1 sm:flex-[2]">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cari Maintenance
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Kontrak, produk, teknisi..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="dark:bg-boxdark h-10 w-full rounded-lg border border-stroke bg-white px-4 pl-10 outline-none focus:border-primary dark:border-strokedark dark:text-white"
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

          {/* Month Filter - Prominent Position */}
          <div className="w-full sm:w-auto sm:min-w-[240px]">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bulan
            </label>
            <div className="flex items-center">
              <button
                onClick={() => {
                  const currentMonth = filters.month;
                  const newMonth = currentMonth === 1 ? 12 : currentMonth - 1;
                  handleFilterChange("month", newMonth);
                }}
                className="dark:bg-boxdark flex h-10 w-10 items-center justify-center rounded-l-lg border border-r-0 border-stroke bg-white text-gray-600 hover:bg-gray-50 dark:border-strokedark dark:text-gray-300 dark:hover:bg-gray-800"
                title="Bulan Sebelumnya"
              >
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <select
                value={filters.month}
                onChange={(e) =>
                  handleFilterChange("month", Number(e.target.value))
                }
                className={`dark:bg-boxdark h-10 w-full border border-stroke bg-white px-4 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white ${
                  filters.month > 0
                    ? "font-medium text-primary dark:text-primary"
                    : ""
                }`}
              >
                <option value={0}>Semua Bulan</option>
                {monthNames.map((month, index) => (
                  <option key={index + 1} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const currentMonth = filters.month;
                  const newMonth = currentMonth === 12 ? 1 : currentMonth + 1;
                  handleFilterChange("month", newMonth);
                }}
                className="dark:bg-boxdark flex h-10 w-10 items-center justify-center rounded-r-lg border border-l-0 border-stroke bg-white text-gray-600 hover:bg-gray-50 dark:border-strokedark dark:text-gray-300 dark:hover:bg-gray-800"
                title="Bulan Berikutnya"
              >
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            {filters.month > 0 && (
              <div className="mt-1 text-xs text-primary dark:text-primary">
                Menampilkan: {monthNames[filters.month - 1]}
              </div>
            )}
          </div>
        </div>

        {/* Quick Filters and Results Count */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Quick Status Filters */}
          <div className="flex gap-2">
            <button
              onClick={() =>
                handleFilterChange(
                  "status",
                  filters.status === "pending" ? "" : "pending",
                )
              }
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filters.status === "pending"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              Tertunda
            </button>
            <button
              onClick={() =>
                handleFilterChange(
                  "status",
                  filters.status === "scheduled" ? "" : "scheduled",
                )
              }
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filters.status === "scheduled"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              Dijadwalkan
            </button>
            <button
              onClick={() =>
                handleFilterChange(
                  "status",
                  filters.status === "waiting_approval"
                    ? ""
                    : "waiting_approval",
                )
              }
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filters.status === "waiting_approval"
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              Menunggu Approval
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{filteredCount}</span> dari{" "}
            <span className="font-medium">{maintenanceCount}</span> maintenance
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="dark:bg-boxdark flex items-center gap-2 rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-strokedark dark:text-gray-300 dark:hover:bg-gray-800"
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
              <span className="flex h-2 w-2 rounded-full bg-primary"></span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-gray-900/20">
          <div className="space-y-4">
            {/* First Row: Status and Type Filters */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Status Filter */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="dark:bg-boxdark w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
                >
                  <option value="">Semua Status</option>
                  {Object.entries(statusDisplayNames).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Type Filter */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipe Produk
                </label>
                <select
                  value={filters.productType}
                  onChange={(e) =>
                    handleFilterChange("productType", e.target.value)
                  }
                  className="dark:bg-boxdark w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
                >
                  <option value="">Semua Tipe</option>
                  {availableProductTypes.map((type) => (
                    <option key={type} value={type}>
                      {productTypeDisplayNames[type]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Inspection Status Filter */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status Inspeksi
                </label>
                <select
                  value={filters.hasInspection}
                  onChange={(e) =>
                    handleFilterChange("hasInspection", e.target.value)
                  }
                  className="dark:bg-boxdark w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
                >
                  <option value="">Semua</option>
                  <option value="yes">Sudah Diinspeksi</option>
                  <option value="no">Belum Diinspeksi</option>
                </select>
              </div>

              {/* Engineer Filter */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Teknisi
                </label>
                <select
                  value={filters.engineerId}
                  onChange={(e) =>
                    handleFilterChange("engineerId", e.target.value)
                  }
                  className="dark:bg-boxdark w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
                >
                  <option value="">Semua Teknisi</option>
                  {availableEngineers.map((engineer) => (
                    <option key={engineer.id} value={engineer.id}>
                      {engineer.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Second Row: Date Filters */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Year Filter */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tahun
                </label>
                <select
                  value={filters.year}
                  onChange={(e) =>
                    handleFilterChange("year", Number(e.target.value))
                  }
                  className="dark:bg-boxdark w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
                >
                  <option value={0}>Semua Tahun</option>
                  {getYearRange().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Start */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={formatDateForInput(filters.dateRange.start)}
                  onChange={(e) =>
                    handleDateRangeChange("start", e.target.value)
                  }
                  className="dark:bg-boxdark w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none [color-scheme:light] focus:border-primary dark:border-strokedark dark:text-white dark:[color-scheme:dark]"
                />
              </div>

              {/* Date Range End */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={formatDateForInput(filters.dateRange.end)}
                  onChange={(e) => handleDateRangeChange("end", e.target.value)}
                  className="dark:bg-boxdark w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none [color-scheme:light] focus:border-primary dark:border-strokedark dark:text-white dark:[color-scheme:dark]"
                />
              </div>
            </div>

            {/* Third Row: Sorting */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Urutkan Berdasarkan
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="dark:bg-boxdark w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
                >
                  <option value="startDate">Tanggal Mulai</option>
                  <option value="endDate">Tanggal Selesai</option>
                  <option value="status">Status</option>
                  <option value="createdAt">Tanggal Dibuat</option>
                  <option value="updatedAt">Tanggal Diupdate</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Urutan
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) =>
                    handleFilterChange("sortOrder", e.target.value)
                  }
                  className="dark:bg-boxdark w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
                >
                  <option value="asc">Terlama ke Terbaru</option>
                  <option value="desc">Terbaru ke Terlama</option>
                </select>
              </div>
            </div>

            {/* Contract Number Search */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nomor Kontrak
                </label>
                <input
                  type="text"
                  placeholder="Cari nomor kontrak..."
                  value={filters.contractNumber}
                  onChange={(e) =>
                    handleFilterChange("contractNumber", e.target.value)
                  }
                  className="dark:bg-boxdark w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
