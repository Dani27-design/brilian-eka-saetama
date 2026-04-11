"use client";

import { useState } from "react";
import { CustomerType } from "@/types/customer";
import { getProvinces, getBusinessFields, customerTypeOptions } from "@/utils/indonesianRegions";

export interface CustomerFilters {
  search: string;
  customerType: CustomerType | "";
  businessField: string;
  province: string;
  hasContracts: "" | "yes" | "no";
  sortBy: "name" | "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
}

interface CustomerFiltersProps {
  filters: CustomerFilters;
  onFiltersChange: (filters: CustomerFilters) => void;
  onClearFilters: () => void;
  customerCount: number;
  filteredCount: number;
  onAddCustomer: () => void;
  addCustomerLabel: string;
  selectedCount: number;
  onExport: () => void;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onImport: () => void;
  onDownloadTemplate: () => void;
}

const inputBaseClass = "h-10 w-full rounded-lg border border-stroke bg-white px-4 text-sm outline-none transition-colors focus:border-primary";
const selectBaseClass = "h-10 w-full rounded-lg border border-stroke bg-white px-4 text-sm outline-none transition-colors focus:border-primary";
const buttonPrimaryClass = "inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90";
const buttonOutlineClass = "inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50";
const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

export default function CustomerFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  customerCount,
  filteredCount,
  onAddCustomer,
  addCustomerLabel,
  selectedCount,
  onExport,
  onBulkEdit,
  onBulkDelete,
  onClearSelection,
  onImport,
  onDownloadTemplate,
}: CustomerFiltersProps) {
  const [provinces] = useState(getProvinces());
  const [businessFields] = useState(getBusinessFields());
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    filters.customerType ||
    filters.businessField ||
    filters.province ||
    filters.hasContracts ||
    filters.sortBy !== "name" ||
    filters.sortOrder !== "asc";

  const handleFilterChange = (key: keyof CustomerFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Actions */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Cari pelanggan berdasarkan nama, alamat, atau kontak"
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={onAddCustomer} className={buttonPrimaryClass}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {addCustomerLabel}
          </button>

          <button onClick={onImport} className={buttonOutlineClass}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Impor
          </button>

          <button onClick={onExport} className={buttonOutlineClass}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Ekspor
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={buttonOutlineClass}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
              <path fill="currentColor" fillRule="evenodd" d="m8.5 8.379l.44-.44l4.56-4.56V2.5h-11v.879l4.56 4.56l.44.44v4l1-1v-3ZM10 12l-2.5 2.5L6 16V9L1.293 4.293A1 1 0 0 1 1 3.586V2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1.586a1 1 0 0 1-.293.707L10 9v3Z" clipRule="evenodd" />
            </svg>
            Filter
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-primary"></span>
            )}
          </button>

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
            <span className="font-medium text-gray-700">{selectedCount}</span> pelanggan dipilih
          </span>

          <button onClick={onBulkEdit} className={buttonOutlineClass}>
            Edit Pelanggan
          </button>

          <button onClick={onBulkDelete} className={buttonOutlineClass}>
            Hapus Pelanggan
          </button>

          <button onClick={onExport} className={buttonOutlineClass}>
            Ekspor Pelanggan
          </button>

          <button onClick={onClearSelection} className={buttonOutlineClass}>
            Batal Pilih
          </button>
        </div>
      )}

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="rounded-lg border border-stroke bg-white p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Customer Type Filter */}
            <div>
              <label className={labelClass}>
                Tipe Pelanggan
              </label>
              <select
                value={filters.customerType}
                onChange={(e) => handleFilterChange("customerType", e.target.value)}
                className={selectBaseClass}
              >
                <option value="">Semua Tipe</option>
                {customerTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Business Field Filter */}
            <div>
              <label className={labelClass}>
                Bidang Usaha
              </label>
              <select
                value={filters.businessField}
                onChange={(e) => handleFilterChange("businessField", e.target.value)}
                className={selectBaseClass}
              >
                <option value="">Semua Bidang</option>
                {businessFields.map((field) => (
                  <option key={field.id} value={field.name}>
                    {field.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Province Filter */}
            <div>
              <label className={labelClass}>
                Provinsi
              </label>
              <select
                value={filters.province}
                onChange={(e) => handleFilterChange("province", e.target.value)}
                className={selectBaseClass}
              >
                <option value="">Semua Provinsi</option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.name}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Contracts Filter */}
            <div>
              <label className={labelClass}>
                Status Kontrak
              </label>
              <select
                value={filters.hasContracts}
                onChange={(e) => handleFilterChange("hasContracts", e.target.value)}
                className={selectBaseClass}
              >
                <option value="">Semua Status</option>
                <option value="yes">Ada Kontrak</option>
                <option value="no">Belum Ada Kontrak</option>
              </select>
            </div>
          </div>

          {/* Sorting */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                Urutkan Berdasarkan
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className={selectBaseClass}
              >
                <option value="name">Nama Pelanggan</option>
                <option value="createdAt">Tanggal Dibuat</option>
                <option value="updatedAt">Tanggal Diupdate</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Urutan
              </label>
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
