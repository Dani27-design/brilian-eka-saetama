"use client";

import { useState } from "react";
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

interface ProductFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  onClearFilters: () => void;
  productCount: number;
  filteredCount: number;
  availableTypes: string[];
  availableBrands: string[];
  availableSources: string[];
}

export default function ProductFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  productCount,
  filteredCount,
  availableTypes,
  availableBrands,
  availableSources
}: ProductFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if any filters are active (excluding search and default sort)
  const hasActiveFilters = 
    filters.productType ||
    filters.brand ||
    filters.source ||
    filters.contractStatus ||
    filters.sortBy !== "name" ||
    filters.sortOrder !== "asc";

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Cari Produk
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Nama, nomor, brand, tipe..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full rounded-lg border border-stroke bg-white px-4 py-2 pl-10 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
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
        </div>

        {/* Quick Filter Toggle and Results Count */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{filteredCount}</span> dari{" "}
            <span className="font-medium">{productCount}</span> produk
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-strokedark dark:bg-boxdark dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <svg
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Product Type Filter */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipe Produk
              </label>
              <select
                value={filters.productType}
                onChange={(e) => handleFilterChange("productType", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
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
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Brand
              </label>
              <select
                value={filters.brand}
                onChange={(e) => handleFilterChange("brand", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
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
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sumber
              </label>
              <select
                value={filters.source}
                onChange={(e) => handleFilterChange("source", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
              >
                <option value="">Semua Sumber</option>
                {availableSources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>

            {/* Contract Status Filter */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status Kontrak
              </label>
              <select
                value={filters.contractStatus}
                onChange={(e) => handleFilterChange("contractStatus", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
              >
                <option value="">Semua Status</option>
                <option value="assigned">Sudah Dikontrak</option>
                <option value="unassigned">Belum Dikontrak</option>
              </select>
            </div>
          </div>

          {/* Sorting */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Urutkan Berdasarkan
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
              >
                <option value="name">Nama Produk</option>
                <option value="productNumber">Nomor Produk</option>
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
                onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
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