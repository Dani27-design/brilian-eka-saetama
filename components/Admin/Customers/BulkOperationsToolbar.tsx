"use client";

import { useState } from "react";
import Link from "next/link";

interface BulkOperationsToolbarProps {
  selectedCount: number;
  onExport: () => void;
  onBulkEdit: () => void;
  onClearSelection: () => void;
  bulkMode: boolean;
  onToggleBulkMode: () => void;
  onDownloadTemplate: () => void;
}

/**
 * Enhanced toolbar component for customer management with persistent actions
 * Features always-visible primary actions and contextual bulk operations
 */
export default function BulkOperationsToolbar({
  selectedCount,
  onExport,
  onBulkEdit,
  onClearSelection,
  bulkMode,
  onToggleBulkMode,
  onDownloadTemplate,
}: BulkOperationsToolbarProps) {
  return (
    <div className="mb-6 space-y-3">
      {/* Always Visible Primary Actions */}
      <div className="flex flex-col gap-3 rounded-lg border border-stroke bg-white p-3 shadow-sm sm:p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2 md:grid-cols-3">
          <Link
            href="/admin/customers/import"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Impor
          </Link>
          
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Ekspor Semua
          </button>

          <button
            onClick={onDownloadTemplate}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Template
          </button>
        </div>

        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">          
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700 sm:text-sm">Mode Massal:</span>
            <button
              onClick={onToggleBulkMode}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                bulkMode ? 'bg-primary' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={bulkMode}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  bulkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${bulkMode ? 'text-primary' : 'text-gray-500'}`}>
              {bulkMode ? 'AKTIF' : 'NONAKTIF'}
            </span>
          </div>
        </div>
      </div>

      {/* Contextual Bulk Actions - Only shown when items are selected */}
      {bulkMode && selectedCount > 0 && (
        <div className="rounded-lg border-2 border-primary bg-primary/5 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white sm:h-8 sm:w-8">
                  <span className="text-xs font-bold sm:text-sm">{selectedCount}</span>
                </div>
                <span className="text-xs font-medium text-gray-800 sm:text-sm">
                  {selectedCount === 1 ? 'pelanggan terpilih' : 'pelanggan terpilih'}
                </span>
              </div>
              
              <button
                onClick={onClearSelection}
                className="text-xs text-gray-600 hover:text-gray-800 underline focus:outline-none sm:text-sm"
              >
                Hapus pilihan
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2 md:grid-cols-2">
              <button
                onClick={onBulkEdit}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Terpilih
              </button>

              <button
                onClick={() => onExport()}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Ekspor Terpilih
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help text when bulk mode is on but no items selected */}
      {bulkMode && selectedCount === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm text-gray-600">
            💡 Pilih pelanggan menggunakan checkbox untuk melakukan operasi massal
          </p>
        </div>
      )}
    </div>
  );
}