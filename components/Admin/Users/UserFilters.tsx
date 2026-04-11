"use client";

import { useState } from "react";

export interface UserFilters {
  search: string;
  role: "admin" | "engineer" | "user" | "";
  status: "active" | "inactive" | "";
  startDate: string;
  endDate: string;
  sortBy: "name" | "email" | "createdAt";
  sortOrder: "asc" | "desc";
}

interface UserActionsProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  onClearFilters: () => void;
  userCount: number;
  filteredCount: number;
  onAddUser: () => void;
  addUserLabel: string;
}

const roleDisplayNames: Record<string, string> = {
  admin: "Admin",
  engineer: "Engineer",
  user: "Pengguna",
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

export default function UserActionsComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  userCount,
  filteredCount,
  onAddUser,
  addUserLabel,
}: UserActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if any filters are active (excluding search and default sort)
  const hasActiveFilters =
    filters.role !== "" ||
    filters.status !== "" ||
    filters.startDate !== "" ||
    filters.endDate !== "" ||
    filters.sortBy !== "name" ||
    filters.sortOrder !== "asc";

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div>
      {/* Search and Quick Actions */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Cari pengguna berdasarkan nama atau email"
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
          <button onClick={onAddUser} className={buttonPrimaryClass}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {addUserLabel}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={buttonOutlineClass}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16"><path fill="#000000" fill-rule="evenodd" d="m8.5 8.379l.44-.44l4.56-4.56V2.5h-11v.879l4.56 4.56l.44.44v4l1-1v-3ZM10 12l-2.5 2.5L6 16V9L1.293 4.293A1 1 0 0 1 1 3.586V2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1.586a1 1 0 0 1-.293.707L10 9v3Z" clip-rule="evenodd"/></svg>
            Filter
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-primary"></span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className={buttonOutlineClass}
            >
              Hapus Filter
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="mt-4 rounded-lg border border-stroke bg-white p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Role Filter */}
            <div>
              <label className={labelClass}>Peran</label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange("role", e.target.value)}
                className={selectBaseClass}
              >
                <option value="">Semua Peran</option>
                <option value="admin">{roleDisplayNames.admin}</option>
                <option value="engineer">{roleDisplayNames.engineer}</option>
                <option value="user">{roleDisplayNames.user}</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className={selectBaseClass}
              >
                <option value="">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>

            {/* Start Date Filter */}
            <div>
              <label className={labelClass}>Tanggal Mulai</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className={`${inputBaseClass} [color-scheme:light]`}
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className={labelClass}>Tanggal Akhir</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
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
                <option value="name">Nama</option>
                <option value="email">Email</option>
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
