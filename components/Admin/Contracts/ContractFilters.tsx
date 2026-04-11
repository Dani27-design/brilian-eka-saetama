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
  onAddContract: () => void;
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

const inputBaseClass = "h-10 w-full rounded-lg border border-stroke bg-white px-4 text-sm outline-none transition-colors focus:border-primary";
const selectBaseClass = "h-10 w-full rounded-lg border border-stroke bg-white px-4 text-sm outline-none transition-colors focus:border-primary";
const buttonPrimaryClass = "inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90";
const buttonOutlineClass = "inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50";
const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

export default function ContractFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  onAddContract,
  contractCount,
  filteredCount,
  availableCustomers,
}: ContractFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className="space-y-3">
      {/* Search and Actions */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Cari kontrak berdasarkan nomor, nama, atau pelanggan"
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
          <button onClick={onAddContract} className={buttonPrimaryClass}>
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
            Tambah Kontrak
          </button>

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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Status Filter */}
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className={selectBaseClass}
              >
                <option value="">Semua Status</option>
                <option value="active">{statusDisplayNames.active}</option>
                <option value="inactive">{statusDisplayNames.inactive}</option>
                <option value="terminated">{statusDisplayNames.terminated}</option>
              </select>
            </div>

            {/* Contract Type Filter */}
            <div>
              <label className={labelClass}>Tipe Kontrak</label>
              <select
                value={filters.contractType}
                onChange={(e) => handleFilterChange("contractType", e.target.value)}
                className={selectBaseClass}
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
              <label className={labelClass}>Pelanggan</label>
              <select
                value={filters.customer}
                onChange={(e) => handleFilterChange("customer", e.target.value)}
                className={selectBaseClass}
              >
                <option value="">Semua Pelanggan</option>
                {availableCustomers.map((customer) => (
                  <option key={customer} value={customer}>
                    {customer}
                  </option>
                ))}
              </select>
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
                <option value="contractNumber">Nomor Kontrak</option>
                <option value="contractName">Nama Kontrak</option>
                <option value="startDate">Tanggal Mulai</option>
                <option value="endDate">Tanggal Selesai</option>
                <option value="createdAt">Tanggal Dibuat</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Urutan</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
                className={selectBaseClass}
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
