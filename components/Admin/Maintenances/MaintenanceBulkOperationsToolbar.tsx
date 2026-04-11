"use client";

import { useState } from "react";
import Link from "next/link";

interface MaintenanceBulkOperationsToolbarProps {
  selectedCount: number;
  onExport: () => void;
  onBulkStatusUpdate: () => void;
  onBulkEngineerAssignment: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  loading?: boolean;
}

/**
 * Enhanced toolbar component for maintenance management with bulk operations
 * Features always-visible primary actions and contextual bulk operations
 */
export default function MaintenanceBulkOperationsToolbar({
  selectedCount,
  onExport,
  onBulkStatusUpdate,
  onBulkEngineerAssignment,
  onBulkDelete,
  onClearSelection,
  loading = false
}: MaintenanceBulkOperationsToolbarProps) {
  return (
    <div className="mb-6 space-y-3">
      {/* Always Visible Primary Actions */}
      <div className="flex flex-col gap-3 rounded-lg border border-stroke bg-white p-3 shadow-sm sm:p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2 md:grid-cols-3">
          <Link
            href="/admin/maintenances/create"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Buat Jadwal
          </Link>
          
          <button
            onClick={onExport}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {loading ? "Exporting..." : "Ekspor Data"}
          </button>

          <Link
            href="/admin/maintenances/calendar"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Calendar View
          </Link>
        </div>
      </div>

      {/* Contextual Bulk Actions - Only shown when items are selected */}
      {selectedCount > 0 && (
        <div className="rounded-lg border-2 border-primary bg-primary/5 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white sm:h-8 sm:w-8">
                  <span className="text-xs font-bold sm:text-sm">{selectedCount}</span>
                </div>
                <span className="text-xs font-medium text-gray-800 sm:text-sm">
                  {selectedCount === 1 ? 'maintenance terpilih' : 'maintenance terpilih'}
                </span>
              </div>
              
              <button
                onClick={onClearSelection}
                className="text-xs text-gray-600 hover:text-gray-800 underline focus:outline-none sm:text-sm"
              >
                Hapus pilihan
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2 md:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={onBulkStatusUpdate}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Update Status
              </button>

              <button
                onClick={onBulkEngineerAssignment}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                Assign Engineers
              </button>

              <button
                onClick={() => onExport()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Selected
              </button>

              <button
                onClick={onBulkDelete}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}