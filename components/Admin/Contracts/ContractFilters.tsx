"use client";

import { useState } from "react";

export interface ContractFilters {
  search: string;
  status: "active" | "inactive" | "terminated" | "";
  contractType: "service" | "maintenance" | "rental" | "sales" | "other" | "";
  customer: string;
  sortBy: "contractNumber" | "contractName" | "startDate" | "endDate" | "createdAt";
  sortOrder: "asc" | "desc";
}

interface ContractFiltersProps {
  filters: ContractFilters;
  onFiltersChange: (filters: ContractFilters) => void;
  onClearFilters: () => void;
  contractCount: number;
  filteredCount: number;
  availableCustomers: string[];
}

const statusDisplayNames: Record<string, string> = {
  active: "Aktif",
  inactive: "Tidak Aktif",
  terminated: "Dihentikan",
};

const contractTypeDisplayNames: Record<string, string> = {
  service: "Service",
  maintenance: "Maintenance",
  rental: "Rental",
  sales: "Sales",
  other: "Lainnya",
};

export default function ContractFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  contractCount,
  filteredCount,
  availableCustomers,
}: ContractFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if any filters are active (excluding search and default sort)
  const hasActiveFilters =
    filters.status !== "" ||
    filters.contractType !== "" ||
    filters.customer !== "" ||
    filters.sortBy !== "contractNumber" ||
    filters.sortOrder !== "asc";

  const handleFilterChange = (key: keyof ContractFilters, value: any) => {
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
            Cari Kontrak
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Nomor kontrak, nama, pelanggan..."
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
            <span className="font-medium">{contractCount}</span> kontrak
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
                <option value="active">{statusDisplayNames.active}</option>
                <option value="inactive">{statusDisplayNames.inactive}</option>
                <option value="terminated">{statusDisplayNames.terminated}</option>
              </select>
            </div>

            {/* Contract Type Filter */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tipe Kontrak
              </label>
              <select
                value={filters.contractType}
                onChange={(e) => handleFilterChange("contractType", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Semua Tipe</option>
                <option value="service">{contractTypeDisplayNames.service}</option>
                <option value="maintenance">{contractTypeDisplayNames.maintenance}</option>
                <option value="rental">{contractTypeDisplayNames.rental}</option>
                <option value="sales">{contractTypeDisplayNames.sales}</option>
                <option value="other">{contractTypeDisplayNames.other}</option>
              </select>
            </div>

            {/* Customer Filter */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Pelanggan
              </label>
              <select
                value={filters.customer}
                onChange={(e) => handleFilterChange("customer", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Semua Pelanggan</option>
                {availableCustomers.map((customer) => (
                  <option key={customer} value={customer}>
                    {customer}
                  </option>
                ))}
              </select>
            </div>

            {/* Placeholder for grid alignment */}
            <div className="hidden lg:block"></div>
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
                <option value="contractNumber">Nomor Kontrak</option>
                <option value="contractName">Nama Kontrak</option>
                <option value="startDate">Tanggal Mulai</option>
                <option value="endDate">Tanggal Selesai</option>
                <option value="createdAt">Tanggal Dibuat</option>
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
                <option value="asc">A-Z / Terlama</option>
                <option value="desc">Z-A / Terbaru</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
