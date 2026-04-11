"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductType } from "@/types/product";

export interface ProductFilters {
  search: string;
  productType: ProductType | "";
  brand: string;
  source: string;
  contractStatus: "" | "assigned" | "unassigned";
  sortBy: "name" | "productNumber" | "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
}

interface ProductActionsProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  onClearFilters: () => void;
  productCount: number;
  filteredCount: number;
  availableTypes: string[];
  availableBrands: string[];
  availableSources: string[];
  onAddProduct: () => void;
  addProductLabel: string;
  // Bulk operations
  selectedCount: number;
  onExport: () => void;
  onBulkEdit: () => void;
  onBulkQR: () => void;
  onBulkAddToContract: () => void;
  onClearSelection: () => void;
}

const inputBaseClass =
  "h-10 w-full rounded-lg border border-stroke bg-white px-4 text-sm outline-none transition-colors focus:border-primary";

const selectBaseClass =
  "h-10 w-full rounded-lg border border-stroke bg-white px-4 text-sm outline-none transition-colors focus:border-primary";

const buttonPrimaryClass =
  "inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90";

const buttonOutlineClass =
  "inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

export default function ProductFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  productCount,
  filteredCount,
  availableTypes,
  availableBrands,
  availableSources,
  onAddProduct,
  addProductLabel,
  selectedCount,
  onExport,
  onBulkEdit,
  onBulkQR,
  onBulkAddToContract,
  onClearSelection,
}: ProductActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    filters.productType ||
    filters.brand ||
    filters.source ||
    filters.contractStatus ||
    filters.sortBy !== "productNumber" ||
    filters.sortOrder !== "asc";

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
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
            placeholder="Cari produk berdasarkan nama, nomor, brand, atau tipe"
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
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={onAddProduct} className={buttonPrimaryClass}>
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
            {addProductLabel}
          </button>

          <Link href="/admin/products/import" className={buttonOutlineClass}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Impor
          </Link>

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

      {/* Row 2: Bulk Operations (only when items selected) */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-stroke bg-white px-4 py-2.5 shadow-sm">
          <span className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{selectedCount}</span> produk dipilih
          </span>

          <button onClick={onBulkEdit} className={buttonOutlineClass}>
            Edit Produk
          </button>

          <button onClick={onBulkAddToContract} className={buttonOutlineClass}>
            Masukkan ke Kontrak
          </button>

          <button onClick={onBulkQR} className={buttonOutlineClass}>
            Unduh QR
          </button>

          <button onClick={onExport} className={buttonOutlineClass}>
            Ekspor Produk
          </button>

          <button onClick={onClearSelection} className={buttonOutlineClass}>
            Batal Pilih
          </button>
        </div>
      )}

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="rounded-lg border border-stroke bg-white p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Product Type Filter */}
            <div>
              <label className={labelClass}>Tipe Produk</label>
              <select
                value={filters.productType}
                onChange={(e) => handleFilterChange("productType", e.target.value)}
                className={selectBaseClass}
              >
                <option value="">Semua Tipe</option>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className={labelClass}>Brand</label>
              <select
                value={filters.brand}
                onChange={(e) => handleFilterChange("brand", e.target.value)}
                className={selectBaseClass}
              >
                <option value="">Semua Brand</option>
                {availableBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <label className={labelClass}>Sumber</label>
              <select
                value={filters.source}
                onChange={(e) => handleFilterChange("source", e.target.value)}
                className={selectBaseClass}
              >
                <option value="">Semua Sumber</option>
                {availableSources.map((source) => (
                  <option key={source} value={source}>
                    {source}
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
                <option value="productNumber">Nomor Produk</option>
                <option value="name">Nama Produk</option>
                <option value="createdAt">Tanggal Dibuat</option>
                <option value="updatedAt">Tanggal Diupdate</option>
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
