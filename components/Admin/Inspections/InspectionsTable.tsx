"use client";
import React, { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getChecklistItemsByType,
  getChecklistItemStatus,
  getChecklistItemRemarks,
} from "@/utils/checklistHelpers";
import { MaintenanceStatus } from "@/types/maintenances";
import { ProductType } from "@/types/product";
const statusColors: Record<MaintenanceStatus, string> = {
  pending: "bg-gray-100 text-gray-700", scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-purple-100 text-purple-700", waiting_approval: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700",
};
const statusDisplay: Record<MaintenanceStatus, string> = {
  pending: "Tertunda", scheduled: "Dijadwalkan", in_progress: "Sedang Dikerjakan",
  waiting_approval: "Menunggu Disetujui", approved: "Disetujui", rejected: "Ditolak",
};
interface InspectionsTableProps {
  inspections: any[]; filteredInspections: any[]; loading: boolean;
  filterProductType: ProductType | ""; currentPage: number; itemsPerPage: number;
  hasNextPage: boolean; totalCount: number | null; isLoadingCount: boolean;
  isLoadingMore: boolean; actionLoading: string | null; certificateLoading: string | null;
  countCacheTimestamp: number | null; COUNT_CACHE_DURATION: number;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onGenerateCertificate: (inspection: any) => void;
  onOpenPhotoGallery: (photos: string[], startIndex?: number) => void;
  onFetchInspections: (page: number) => void; onFetchTotalCount: (force?: boolean) => void;
  onSetItemsPerPage: (size: number) => void; onSetCurrentPage: (page: number) => void;
}
function InspectionsTable({
  inspections,
  filteredInspections,
  loading,
  filterProductType,
  currentPage,
  itemsPerPage,
  hasNextPage,
  totalCount,
  isLoadingCount,
  isLoadingMore,
  actionLoading,
  certificateLoading,
  onUpdateStatus,
  onGenerateCertificate,
  onOpenPhotoGallery,
  onFetchInspections,
  onFetchTotalCount,
  onSetItemsPerPage,
  onSetCurrentPage,
}: InspectionsTableProps) {
  const handlePageSizeChange = (newPageSize: number) => {
    onSetItemsPerPage(newPageSize);
    onSetCurrentPage(1);
    onFetchInspections(1);
    onFetchTotalCount(true);
  };
  return (
    <div className="rounded-lg border border-stroke bg-white p-4">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-2 text-gray-500">Memuat inspeksi...</p>
          </div>
        </div>
      ) : filteredInspections.length === 0 ? (
        <div className="py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            {inspections.length === 0 ? "Tidak ada data inspeksi" : "Tidak ada inspeksi yang sesuai dengan filter"}
          </h3>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-stroke bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                  <th className="px-4 py-3">Produk & Kontrak</th>
                  <th className="px-4 py-3">Lokasi</th>
                  <th className="px-4 py-3">Inspeksi</th>
                  {filterProductType &&
                    getChecklistItemsByType(filterProductType).map((item) => (
                      <th
                        key={item}
                        className="min-w-24 px-4 py-3 text-center"
                      >
                        {item}
                      </th>
                    ))}
                  <th className="px-4 py-3">Foto</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {filteredInspections.map((inspection) => (
                  <tr key={inspection.id} className="text-sm hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-medium">
                            {inspection.productNumber}
                          </span>
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800">
                            {inspection.productType}
                          </span>
                        </div>
                        <span className="mb-1 text-xs text-gray-700">
                          {inspection.productName}
                        </span>
                        <span className="text-xs text-gray-500">
                          Brand: {inspection.productBrand}
                        </span>
                        <span className="text-xs text-gray-500">
                          Exp: {inspection.expirationDate}
                        </span>
                        <div className="mt-2 border-t border-gray-200 pt-2">
                          <span className="text-xs font-medium text-gray-600">
                            {inspection.contractNumber}
                          </span>
                          <span className="block text-xs text-gray-500">
                            {inspection.contractName}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{inspection.location}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {inspection.inspectionDate}
                        </span>
                        <div className="mt-1">
                          {inspection.engineerNames.map((name, idx) => (
                            <span
                              key={idx}
                              className="mr-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    {filterProductType &&
                      getChecklistItemsByType(filterProductType).map(
                        (item) => {
                          const status = getChecklistItemStatus(
                            inspection.checklistDetails,
                            item,
                          );
                          const remarks = getChecklistItemRemarks(
                            inspection.checklistDetails,
                            item,
                          );
                          return (
                            <td key={item} className="px-4 py-3 text-center">
                              <div className="flex flex-col items-center">
                                <div className="flex min-h-[3rem] flex-col items-center">
                                  {status === "OK" ? (
                                    <svg
                                      className="h-5 w-5 text-green-600"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  ) : status === "NOK" ? (
                                    <svg
                                      className="h-5 w-5 text-red-600"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      className="h-5 w-5 text-gray-400"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                  <span
                                    className="max-w-20 mt-1 px-1 text-center text-xs"
                                    title={
                                      remarks !== "-"
                                        ? remarks
                                        : status === "-"
                                        ? "Item checklist belum diisi"
                                        : ""
                                    }
                                  >
                                    {remarks !== "-" ? (
                                      <span className="text-gray-600">
                                        {remarks}
                                      </span>
                                    ) : status === "-" ? (
                                      <span className="italic text-gray-400">
                                        Belum diisi
                                      </span>
                                    ) : (
                                      <span>&nbsp;</span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>
                          );
                        },
                      )}
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center">
                        {inspection.photos.length > 0 ? (
                          <>
                            <button
                              onClick={() =>
                                onOpenPhotoGallery(inspection.photos, 0)
                              }
                              className="group relative"
                            >
                              <Image
                                src={inspection.photos[0]}
                                alt="Foto inspeksi"
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded object-cover transition-transform hover:scale-110"
                              />
                              {inspection.photos.length > 1 && (
                                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                                  {inspection.photos.length}
                                </div>
                              )}
                            </button>
                            <span className="mt-1 text-xs text-gray-500">
                              {inspection.photos.length} foto
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Tidak ada foto
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`${
                            statusColors[inspection.status]
                          } inline-flex rounded-full px-2 py-1 text-xs font-medium`}
                        >
                          {statusDisplay[inspection.status]}
                        </span>
                        {inspection.canApprove && (
                          <div className="flex gap-1">
                            <button
                              onClick={() =>
                                onUpdateStatus(inspection.id, "approved")
                              }
                              disabled={actionLoading === inspection.id}
                              className="rounded bg-green-500 px-2 py-1 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
                            >
                              {actionLoading === inspection.id ? "..." : "✓"}
                            </button>
                            <button
                              onClick={() =>
                                onUpdateStatus(inspection.id, "rejected")
                              }
                              disabled={actionLoading === inspection.id}
                              className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                            >
                              {actionLoading === inspection.id ? "..." : "✕"}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/inspections/edit/${inspection.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90"
                        >
                          <svg
                            className="mr-1 h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </Link>
                        {inspection.status === "approved" && (
                          <button
                            onClick={() => onGenerateCertificate(inspection)}
                            disabled={certificateLoading === inspection.id}
                            className="inline-flex w-16 items-center justify-center rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-200 disabled:opacity-50"
                            title="Generate PDF Certificate"
                          >
                            {certificateLoading === inspection.id ? (
                              <div className="h-3 w-3 animate-spin rounded-full border border-green-800 border-t-transparent"></div>
                            ) : (
                              "Sertifikat"
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(currentPage > 1 ||
            hasNextPage ||
            filteredInspections.length > 0) && (
            <div className="mt-4 flex flex-col items-center justify-between space-y-3 border-t pt-4 sm:flex-row sm:space-y-0">
              <div className="text-xs text-gray-600">
                {isLoadingCount
                  ? "Menghitung total data..."
                  : totalCount !== null
                  ? `Halaman ${currentPage} dari ${Math.ceil(
                      totalCount / itemsPerPage,
                    )} (Total: ${totalCount} inspeksi)`
                  : `Halaman ${currentPage} ${
                      hasNextPage ? "(ada lanjutan)" : "(halaman terakhir)"
                    }`}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Item per halaman:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  disabled={loading || isLoadingMore}
                  className="rounded-md border px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (currentPage > 1) {
                      onFetchInspections(currentPage - 1);
                    }
                  }}
                  disabled={currentPage === 1 || isLoadingMore}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
                    currentPage === 1 || isLoadingMore
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : "border-stroke bg-white hover:bg-gray-100"
                  }`}
                >
                  {isLoadingMore && currentPage > 1 ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="m 4 12 a 8 8 0 0 1 8 -8"
                      />
                    </svg>
                  ) : (
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-gray-600">
                  {isLoadingCount ? (
                    "Menghitung..."
                  ) : totalCount !== null ? (
                    <>
                      Halaman{" "}
                      <span className="font-medium">{currentPage}</span> dari{" "}
                      {Math.ceil(totalCount / itemsPerPage)}
                    </>
                  ) : (
                    <>
                      Halaman{" "}
                      <span className="font-medium">{currentPage}</span>
                      {hasNextPage && <span> (ada lanjutan)</span>}
                    </>
                  )}
                </span>
                <button
                  onClick={() => {
                    if (hasNextPage) {
                      onFetchInspections(currentPage + 1);
                    }
                  }}
                  disabled={!hasNextPage || isLoadingMore}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
                    !hasNextPage || isLoadingMore
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : "border-stroke bg-white hover:bg-gray-100"
                  }`}
                >
                  {isLoadingMore && hasNextPage ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="m 4 12 a 8 8 0 0 1 8 -8"
                      />
                    </svg>
                  ) : (
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default memo(InspectionsTable);