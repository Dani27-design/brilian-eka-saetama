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
  onAddMaintenance: () => void;
  onCalendarView: () => void;
  selectedCount: number;
  onExport: () => void;
  onBulkEngineerAssignment: () => void;
  onClearSelection: () => void;
}

const statusDisplayNames: Record<MaintenanceStatus, string> = {
  scheduled: "Dijadwalkan",
  pending: "Tertunda",
  in_progress: "Sedang Dikerjakan",
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

const inputBaseClass =
  "h-10 w-full rounded-lg border border-stroke bg-white px-4 text-sm outline-none transition-colors focus:border-primary";
const selectBaseClass =
  "h-10 w-full rounded-lg border border-stroke bg-white px-4 text-sm outline-none transition-colors focus:border-primary";
const buttonPrimaryClass =
  "inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90";
const buttonOutlineClass =
  "inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50";
const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

export default function MaintenanceFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  maintenanceCount,
  filteredCount,
  availableEngineers,
  availableContracts,
  availableProductTypes,
  onAddMaintenance,
  onCalendarView,
  selectedCount,
  onExport,
  onBulkEngineerAssignment,
  onClearSelection,
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
    <div className="space-y-3">
      {/* Search, Month Filter, and Actions Row */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search + Month */}
        <div className="flex flex-1 items-center gap-3">
          <div className="relative max-w-md flex-1">
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

          {/* Month Filter */}
          <select
            value={filters.month}
            onChange={(e) =>
              handleFilterChange("month", Number(e.target.value))
            }
            className={`h-10 w-auto min-w-[140px] rounded-lg border border-stroke bg-white p-2 text-sm outline-none transition-colors focus:border-primary ${
              filters.month > 0 ? "font-medium text-primary" : ""
            }`}
          >
            <option value={0}>Semua Bulan</option>
            {monthNames.map((month, index) => (
              <option key={index + 1} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Buat Jadwal */}
          <button onClick={onAddMaintenance} className={buttonPrimaryClass}>
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Buat Jadwal
          </button>

          {/* Kalender */}
          <button onClick={onCalendarView} className={buttonOutlineClass}>
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Kalender
          </button>

          {/* Ekspor */}
          <button onClick={onExport} className={buttonOutlineClass}>
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Ekspor
          </button>

          {/* Filter */}
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

          {/* Hapus Filter */}
          {hasActiveFilters && (
            <button onClick={onClearFilters} className={buttonOutlineClass}>
              Hapus Filter
            </button>
          )}
        </div>
      </div>

      {/* Bulk Operations Row */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-stroke bg-white px-4 py-2.5 shadow-sm">
          <span className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{selectedCount}</span>{" "}
            maintenance dipilih
          </span>

          <button
            onClick={onBulkEngineerAssignment}
            className={buttonOutlineClass}
          >
            Tugaskan Teknisi
          </button>

          <button onClick={onExport} className={buttonOutlineClass}>
            Ekspor Terpilih
          </button>

          <button onClick={onClearSelection} className={buttonOutlineClass}>
            Batal Pilih
          </button>
        </div>
      )}

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="rounded-lg border border-stroke bg-white p-4">
          <div className="space-y-4">
            {/* First Row: Status and Type Filters */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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

              {/* Product Type Filter */}
              <div>
                <label className={labelClass}>Tipe Produk</label>
                <select
                  value={filters.productType}
                  onChange={(e) =>
                    handleFilterChange("productType", e.target.value)
                  }
                  className={selectBaseClass}
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
                <label className={labelClass}>Status Inspeksi</label>
                <select
                  value={filters.hasInspection}
                  onChange={(e) =>
                    handleFilterChange("hasInspection", e.target.value)
                  }
                  className={selectBaseClass}
                >
                  <option value="">Semua</option>
                  <option value="yes">Sudah Diinspeksi</option>
                  <option value="no">Belum Diinspeksi</option>
                </select>
              </div>

              {/* Engineer Filter */}
              <div>
                <label className={labelClass}>Teknisi</label>
                <select
                  value={filters.engineerId}
                  onChange={(e) =>
                    handleFilterChange("engineerId", e.target.value)
                  }
                  className={selectBaseClass}
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
                <label className={labelClass}>Tahun</label>
                <select
                  value={filters.year}
                  onChange={(e) =>
                    handleFilterChange("year", Number(e.target.value))
                  }
                  className={selectBaseClass}
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
                <label className={labelClass}>Tanggal Mulai</label>
                <input
                  type="date"
                  value={formatDateForInput(filters.dateRange.start)}
                  onChange={(e) =>
                    handleDateRangeChange("start", e.target.value)
                  }
                  className={`${inputBaseClass} [color-scheme:light]`}
                />
              </div>

              {/* Date Range End */}
              <div>
                <label className={labelClass}>Tanggal Selesai</label>
                <input
                  type="date"
                  value={formatDateForInput(filters.dateRange.end)}
                  onChange={(e) => handleDateRangeChange("end", e.target.value)}
                  className={`${inputBaseClass} [color-scheme:light]`}
                />
              </div>
            </div>

            {/* Third Row: Sorting */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Urutkan Berdasarkan</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className={selectBaseClass}
                >
                  <option value="startDate">Tanggal Mulai</option>
                  <option value="endDate">Tanggal Selesai</option>
                  <option value="status">Status</option>
                  <option value="createdAt">Tanggal Dibuat</option>
                  <option value="updatedAt">Tanggal Diupdate</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Urutan</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) =>
                    handleFilterChange("sortOrder", e.target.value)
                  }
                  className={selectBaseClass}
                >
                  <option value="asc">Terlama ke Terbaru</option>
                  <option value="desc">Terbaru ke Terlama</option>
                </select>
              </div>
            </div>

            {/* Contract Number Search */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Nomor Kontrak</label>
                <input
                  type="text"
                  placeholder="Cari nomor kontrak..."
                  value={filters.contractNumber}
                  onChange={(e) =>
                    handleFilterChange("contractNumber", e.target.value)
                  }
                  className={inputBaseClass}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
