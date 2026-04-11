"use client";

import { useState } from "react";

export interface BlogFilters {
  search: string;
  author: string;
  startDate: string;
  endDate: string;
  sortBy: "title" | "publishDate" | "createdAt";
  sortOrder: "asc" | "desc";
}

interface BlogFiltersProps {
  filters: BlogFilters;
  onFiltersChange: (filters: BlogFilters) => void;
  onClearFilters: () => void;
  blogCount: number;
  filteredCount: number;
  availableAuthors: string[];
}

export default function BlogFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  blogCount,
  filteredCount,
  availableAuthors,
}: BlogFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if any filters are active (excluding search and default sort)
  const hasActiveFilters =
    filters.author !== "" ||
    filters.startDate !== "" ||
    filters.endDate !== "" ||
    filters.sortBy !== "publishDate" ||
    filters.sortOrder !== "desc";

  const handleFilterChange = (key: keyof BlogFilters, value: any) => {
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
            Cari Blog
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Judul, deskripsi..."
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
            <span className="font-medium">{blogCount}</span> blog
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
            {/* Author Filter */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Author
              </label>
              <select
                value={filters.author}
                onChange={(e) => handleFilterChange("author", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Semua Author</option>
                {availableAuthors.map((author) => (
                  <option key={author} value={author}>
                    {author}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date Filter */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none [color-scheme:light] focus:border-primary"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm outline-none [color-scheme:light] focus:border-primary"
              />
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
                <option value="publishDate">Tanggal Publish</option>
                <option value="title">Judul</option>
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
