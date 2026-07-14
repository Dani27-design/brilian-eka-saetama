"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, getDocs, updateDoc, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { Maintenance, MaintenanceStatus } from "@/types/maintenances";
import { ProductType } from "@/types/product";
import { useAdmin } from "@/app/context/AdminContext";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import toast from "react-hot-toast";

import MaintenanceFiltersComponent, { MaintenanceFilters } from "@/components/Admin/Maintenances/MaintenanceFilters";
import SortableMaintenanceHeader from "@/components/Admin/Maintenances/SortableMaintenanceHeader";
import BulkEngineerAssignmentModal, { AssignmentMode } from "@/components/Admin/Maintenances/BulkEngineerAssignmentModal";
import { buildMaintenanceQuery, canUseMaintenanceFirestoreSort } from "@/utils/maintenanceQuery";
import { loadMaintenancesWithRelatedData, loadAvailableEngineers, loadAvailableContracts, createPerformanceMonitor, MaintenanceTableRow } from "@/utils/maintenanceDataLoader";
import { filterAndSortMaintenances, createDefaultMaintenanceFilters, resetMaintenanceFilters } from "@/utils/maintenanceFilters";
import { downloadMaintenanceExport, DEFAULT_MAINTENANCE_EXPORT_CONFIG } from "@/utils/maintenanceExportGenerator";

// Import existing components we'll reuse
import Modal from "@/components/Admin/Modal";
import Image from "next/image";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const statusColor: Record<MaintenanceStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  pending: "bg-gray-100 text-gray-700",
  in_progress: "bg-purple-100 text-purple-700",
  waiting_approval: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const statusDisplay: Record<MaintenanceStatus, string> = {
  scheduled: "Dijadwalkan",
  pending: "Tertunda",
  in_progress: "Sedang Dikerjakan",
  waiting_approval: "Menunggu Disetujui",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export default function MaintenancesPage() {
  const { user } = useAdmin();
  const router = useRouter();
  usePageHeader("Manajemen Pemeliharaan", "Kelola jadwal pemeliharaan dengan sistem yang dioptimalkan");

  // Core data state
  const [allMaintenances, setAllMaintenances] = useState<MaintenanceTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Filter and UI state
  const [filters, setFilters] = useState<MaintenanceFilters>(createDefaultMaintenanceFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Bulk operations state (always enabled like product management)
  const [selectedMaintenances, setSelectedMaintenances] = useState<Set<string>>(new Set());
  
  // Modal states (for future use)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  
  // Engineer assignment modal state
  const [isBulkEngineerModalOpen, setIsBulkEngineerModalOpen] = useState(false);
  const [singleAssignMaintenanceId, setSingleAssignMaintenanceId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Filter options
  const [availableEngineers, setAvailableEngineers] = useState<Array<{ id: string; name: string }>>([]);
  const [availableContracts, setAvailableContracts] = useState<Array<{ id: string; contractNumber: string }>>([]);

  // Load initial data
  useEffect(() => {
    loadMaintenanceData();
    loadFilterOptions();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const loadMaintenanceData = async () => {
    const monitor = createPerformanceMonitor();
    
    try {
      setLoading(true);
      setError("");

      const maintenancesCollection = collection(firestore, "maintenances");
      
      // Try to use optimized Firestore query if possible
      let maintenanceDocuments: Maintenance[] = [];
      
      if (canUseMaintenanceFirestoreSort(filters)) {
        const { query: firestoreQuery } = buildMaintenanceQuery(maintenancesCollection, filters);
        if (firestoreQuery) {
          const snapshot = await getDocs(firestoreQuery);
          maintenanceDocuments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Maintenance));
        } else {
          // Fallback to loading all
          const snapshot = await getDocs(maintenancesCollection);
          maintenanceDocuments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Maintenance));
        }
      } else {
        // Load all documents for client-side filtering
        const snapshot = await getDocs(maintenancesCollection);
        maintenanceDocuments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Maintenance));
      }

      // Load related data with batch processing
      const maintenancesWithData = await loadMaintenancesWithRelatedData(maintenanceDocuments);
      setAllMaintenances(maintenancesWithData);
      
      monitor.end("Load maintenances with related data", maintenancesWithData.length);
      
    } catch (error) {
      console.error("Failed to load maintenances:", error);
      setError("Gagal memuat data maintenance");
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const [engineers, contracts] = await Promise.all([
        loadAvailableEngineers(),
        loadAvailableContracts()
      ]);
      
      setAvailableEngineers(engineers);
      setAvailableContracts(contracts);
    } catch (error) {
      console.error("Failed to load filter options:", error);
    }
  };

  // Memoized filtered and paginated data
  const { filteredMaintenances, paginatedMaintenances, totalPages } = useMemo(() => {
    const filtered = filterAndSortMaintenances(allMaintenances, filters);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      filteredMaintenances: filtered,
      paginatedMaintenances: paginated,
      totalPages
    };
  }, [allMaintenances, filters, currentPage, itemsPerPage]);

  // Event handlers
  const handleFiltersChange = useCallback((newFilters: MaintenanceFilters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(resetMaintenanceFilters(filters, true));
  }, [filters]);

  const handleSort = useCallback((sortBy: MaintenanceFilters['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === "asc" ? "desc" : "asc"
    }));
  }, []);

  const handleExport = useCallback(() => {
    const dataToExport = selectedMaintenances.size > 0 
      ? filteredMaintenances.filter(m => selectedMaintenances.has(m.id))
      : filteredMaintenances;
      
    downloadMaintenanceExport(dataToExport, DEFAULT_MAINTENANCE_EXPORT_CONFIG);
  }, [filteredMaintenances, selectedMaintenances]);

  // Bulk operations handlers
  const toggleMaintenanceSelection = useCallback((maintenanceId: string) => {
    const newSelected = new Set(selectedMaintenances);
    if (newSelected.has(maintenanceId)) {
      newSelected.delete(maintenanceId);
    } else {
      newSelected.add(maintenanceId);
    }
    setSelectedMaintenances(newSelected);
  }, [selectedMaintenances]);

  const clearSelection = useCallback(() => {
    setSelectedMaintenances(new Set());
  }, []);

  // Status update handler
  const updateMaintenanceStatus = async (maintenanceId: string, newStatus: MaintenanceStatus) => {
    setActionLoading(maintenanceId);
    try {
      const maintenanceRef = doc(firestore, "maintenances", maintenanceId);
      await updateDoc(maintenanceRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
      });

      // Update local state
      setAllMaintenances(prev => 
        prev.map(m => m.id === maintenanceId ? { ...m, status: newStatus } : m)
      );
    } catch (error) {
      setError("Gagal mengupdate status");
      console.error("Error updating status:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkEngineerAssignment = () => {
    setIsBulkEngineerModalOpen(true);
  };

  // Helper function to calculate new engineer assignments based on mode
  const calculateNewEngineers = (
    currentEngineers: Array<{ id: string; name: string }>,
    selectedEngineers: string[],
    mode: AssignmentMode
  ): string[] => {
    const currentIds = currentEngineers.map(e => e.id);
    
    switch (mode) {
      case "replace":
        return selectedEngineers;
      case "add":
        // Add selected engineers to existing ones (avoid duplicates)
        return Array.from(new Set([...currentIds, ...selectedEngineers]));
      case "remove":
        // Remove selected engineers from existing ones
        return currentIds.filter(id => !selectedEngineers.includes(id));
      default:
        return currentIds;
    }
  };

  // Main engineer assignment function (works for both single and bulk)
  const performBulkEngineerAssignment = async (
    engineerIds: string[],
    mode: AssignmentMode
  ) => {
    // Determine which maintenances to process: single-assign or bulk selection
    const maintenanceIds = singleAssignMaintenanceId
      ? [singleAssignMaintenanceId]
      : Array.from(selectedMaintenances);

    if (maintenanceIds.length === 0) {
      toast.error("Tidak ada maintenance yang dipilih");
      return;
    }

    setBulkLoading(true);

    try {
      // Get maintenance data for validation and processing
      const selectedMaintenanceData = maintenanceIds
        .map(id => allMaintenances.find(m => m.id === id))
        .filter(Boolean) as MaintenanceTableRow[];

      // Filter out maintenances that cannot be modified (have inspections)
      const validMaintenances = selectedMaintenanceData.filter(m => !m.hasInspection);
      
      if (validMaintenances.length === 0) {
        toast.error("Tidak ada maintenance yang dapat dimodifikasi. Semua maintenance yang dipilih sudah memiliki data inspeksi.");
        return;
      }

      // Firebase batch operations are limited to 500
      const BATCH_SIZE = 500;
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < validMaintenances.length; i += BATCH_SIZE) {
        const batchMaintenances = validMaintenances.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(firestore);

        for (const maintenance of batchMaintenances) {
          try {
            const newEngineers = calculateNewEngineers(
              maintenance.engineers,
              engineerIds,
              mode
            );

            // Determine new status based on engineer assignment
            let newStatus: MaintenanceStatus = maintenance.status;
            if (newEngineers.length > 0 && maintenance.status === "pending") {
              newStatus = "scheduled";
            } else if (newEngineers.length === 0 && maintenance.status === "scheduled") {
              newStatus = "pending";
            }

            const maintenanceRef = doc(firestore, "maintenances", maintenance.id);
            const updateData = {
              engineer: newEngineers.map((uid: string) => doc(firestore, "users", uid)),
              status: newStatus,
              updatedAt: serverTimestamp(),
              updatedBy: user?.uid ? doc(firestore, "users", user.uid) : null,
            };

            batch.update(maintenanceRef, updateData);
          } catch (error: any) {
            console.error(`Error preparing update for maintenance ${maintenance.id}:`, error);
            errors.push(`Maintenance ${maintenance.contractNumber}: ${error.message}`);
            errorCount++;
          }
        }

        // Commit the batch
        try {
          await batch.commit();
          successCount += batchMaintenances.length;
          
          // Update local state optimistically
          setAllMaintenances(prev => 
            prev.map(m => {
              const batchMaintenance = batchMaintenances.find(bm => bm.id === m.id);
              if (batchMaintenance) {
                const newEngineers = calculateNewEngineers(
                  m.engineers,
                  engineerIds,
                  mode
                );
                
                let newStatus = m.status;
                if (newEngineers.length > 0 && m.status === "pending") {
                  newStatus = "scheduled";
                } else if (newEngineers.length === 0 && m.status === "scheduled") {
                  newStatus = "pending";
                }

                return {
                  ...m,
                  engineers: newEngineers.map(id => {
                    const engineer = availableEngineers.find(e => e.id === id);
                    return { id, name: engineer?.name || id };
                  }),
                  status: newStatus
                };
              }
              return m;
            })
          );
        } catch (error: any) {
          console.error("Batch commit error:", error);
          batchMaintenances.forEach(m => {
            errors.push(`Maintenance ${m.contractNumber}: Failed to commit - ${error.message}`);
          });
          errorCount += batchMaintenances.length;
          successCount -= batchMaintenances.length;
        }
      }

      // Clear selection after successful operation
      setSelectedMaintenances(new Set());
      setSingleAssignMaintenanceId(null);

      // Show results
      const totalRequested = validMaintenances.length;
      const skippedCount = selectedMaintenanceData.length - validMaintenances.length;

      if (successCount > 0) {
        toast.success(
          `Berhasil mengupdate ${successCount} maintenance. ${
            skippedCount > 0 ? `${skippedCount} maintenance dilewati karena sudah memiliki inspeksi.` : ""
          }`
        );
      }

      if (errorCount > 0) {
        console.error("Bulk assignment errors:", errors);
        toast.error(`${errorCount} maintenance gagal diupdate. Silakan coba lagi.`);
      }

    } catch (error: any) {
      console.error("Bulk engineer assignment error:", error);
      toast.error(`Terjadi kesalahan: ${error.message}`);
    } finally {
      setBulkLoading(false);
    }
  };

  // Get available product types from loaded data
  const availableProductTypes = useMemo(() => {
    const types = new Set<ProductType>();
    allMaintenances.forEach(m => types.add(m.productType));
    return Array.from(types);
  }, [allMaintenances]);

  return (
    <div className="flex h-full flex-col">
      {error && (
        <div className="mb-4 flex-shrink-0 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="break-words">{error}</p>
        </div>
      )}

      {/* Filters & Actions */}
      <div className="mb-4">
        <MaintenanceFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          maintenanceCount={allMaintenances.length}
          filteredCount={filteredMaintenances.length}
          availableEngineers={availableEngineers}
          availableContracts={availableContracts}
          availableProductTypes={availableProductTypes}
          onAddMaintenance={() => router.push("/admin/maintenances/create")}
          onCalendarView={() => router.push("/admin/maintenances/calendar")}
          selectedCount={selectedMaintenances.size}
          onExport={handleExport}
          onBulkEngineerAssignment={handleBulkEngineerAssignment}
          onClearSelection={clearSelection}
        />
      </div>

      {/* Table */}
      <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-white/80 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="mt-2 text-gray-500">Memuat maintenance...</p>
            </div>
          </div>
        ) : filteredMaintenances.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Tidak ada maintenance</h3>
          </div>
        ) : (
          <>
            <div className="styled-scrollbar min-h-0 flex-1 overflow-auto">
              <table className="w-full table-auto">
                <thead className="sticky top-0 z-10 bg-white shadow-[inset_0_-2px_0_0_#bfdbfe]">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                    <th className="px-4 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectedMaintenances.size === paginatedMaintenances.length && paginatedMaintenances.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMaintenances(new Set(paginatedMaintenances.map(m => m.id)));
                          } else {
                            setSelectedMaintenances(new Set());
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="px-4 py-3">Kontrak</th>
                    <th className="px-4 py-3">Produk</th>
                    <SortableMaintenanceHeader sortKey="startDate" currentSort={filters.sortBy} currentOrder={filters.sortOrder} onSort={handleSort}>
                      Periode
                    </SortableMaintenanceHeader>
                    <th className="px-4 py-3">Teknisi</th>
                    <th className="px-4 py-3">Inspeksi</th>
                    <SortableMaintenanceHeader sortKey="status" currentSort={filters.sortBy} currentOrder={filters.sortOrder} onSort={handleSort}>
                      Status
                    </SortableMaintenanceHeader>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke">
                  {paginatedMaintenances.map((maintenance) => (
                    <tr
                      key={maintenance.id}
                      className={`text-sm transition-colors ${
                        maintenance.repairReasons?.length
                          ? selectedMaintenances.has(maintenance.id)
                            ? "bg-yellow-50 hover:bg-yellow-100"
                            : "bg-yellow-50/40 hover:bg-yellow-50"
                          : selectedMaintenances.has(maintenance.id)
                          ? "bg-blue-50 hover:bg-blue-100"
                          : "hover:bg-blue-50/50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedMaintenances.has(maintenance.id)}
                          onChange={() => toggleMaintenanceSelection(maintenance.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{maintenance.contractNumber}</div>
                        <div className="text-xs text-gray-500">{maintenance.contractName}</div>
                        {maintenance.referenceStatus?.contract !== "valid" && (
                          <span className="mt-1 inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                            Referensi kontrak tidak valid
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                          {maintenance.productType}
                        </span>
                        <div className="mt-1 text-sm">
                          <span className="font-medium text-gray-900">{maintenance.productName}</span>
                          <span className="text-gray-500"> · {maintenance.productNumber}</span>
                        </div>
                        {maintenance.referenceStatus?.product !== "valid" && (
                          <span className="mt-1 inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                            Referensi produk tidak valid
                          </span>
                        )}
                        {maintenance.isRepairable && (
                          <span className="ml-1 mt-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Perlu perbaikan data
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">
                          {maintenance.startDate ? format(maintenance.startDate, "dd MMM yyyy", { locale: idLocale }) : "-"}
                        </div>
                        <div className="text-xs text-gray-500">
                          s/d {maintenance.endDate ? format(maintenance.endDate, "dd MMM yyyy", { locale: idLocale }) : "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {maintenance.engineers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {maintenance.engineers.map((eng) => (
                              <span key={eng.id} className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                                {eng.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Belum ditugaskan</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          maintenance.hasInspection ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                        }`}>
                          {maintenance.hasInspection ? "Sudah" : "Belum"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className={`${statusColor[maintenance.status]} inline-flex rounded-full px-2 py-1 text-xs font-medium`}>
                            {statusDisplay[maintenance.status]}
                          </span>
                          {maintenance.status === "waiting_approval" && maintenance.hasInspection && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => updateMaintenanceStatus(maintenance.id, "approved")}
                                disabled={actionLoading === maintenance.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-green-300 bg-white px-2 py-1 text-xs font-medium text-green-600 transition-colors hover:bg-green-50 disabled:opacity-50"
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {actionLoading === maintenance.id ? "..." : "Setujui"}
                              </button>
                              <button
                                onClick={() => updateMaintenanceStatus(maintenance.id, "rejected")}
                                disabled={actionLoading === maintenance.id}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                {actionLoading === maintenance.id ? "..." : "Tolak"}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/maintenances/edit/${maintenance.id}`}
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
                          {!maintenance.hasInspection && (
                            <button
                              onClick={() => {
                                setSingleAssignMaintenanceId(maintenance.id);
                                setIsBulkEngineerModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
                            >
                              <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Tugaskan Teknisi
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="my-0 flex flex-col items-center justify-between space-y-3 border-t border-stroke p-2 sm:flex-row sm:space-y-0">
              <div className="text-xs text-gray-600">
                Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-
                {Math.min(currentPage * itemsPerPage, filteredMaintenances.length)} dari{" "}
                {filteredMaintenances.length} maintenance
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Item per halaman:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="rounded-md border border-stroke bg-white px-2 py-1 text-sm outline-none focus:border-primary"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
                    currentPage === 1
                      ? "cursor-not-allowed border-gray-200 bg-blue-50/50 text-gray-400"
                      : "border-stroke bg-white hover:bg-blue-50"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm text-gray-600">
                  Halaman <span className="font-medium">{currentPage}</span> dari {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
                    currentPage === totalPages || totalPages === 0
                      ? "cursor-not-allowed border-gray-200 bg-blue-50/50 text-gray-400"
                      : "border-stroke bg-white hover:bg-blue-50"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Photo Modal */}
      <Modal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        title="Detail Foto Inspeksi"
      >
        {selectedPhoto && (
          <div className="flex justify-center">
            <Image
              src={selectedPhoto}
              alt="Zoomed Inspection Photo"
              width={800}
              height={600}
              className="max-h-[80vh] w-auto object-contain"
            />
          </div>
        )}
      </Modal>

      {/* Engineer Assignment Modal (single or bulk) */}
      <BulkEngineerAssignmentModal
        isOpen={isBulkEngineerModalOpen}
        onClose={() => {
          setIsBulkEngineerModalOpen(false);
          setSingleAssignMaintenanceId(null);
        }}
        selectedMaintenances={
          singleAssignMaintenanceId
            ? allMaintenances.filter(m => m.id === singleAssignMaintenanceId)
            : Array.from(selectedMaintenances)
                .map(id => allMaintenances.find(m => m.id === id))
                .filter(Boolean) as MaintenanceTableRow[]
        }
        onAssign={performBulkEngineerAssignment}
        availableEngineers={availableEngineers}
        loading={bulkLoading}
      />
    </div>
  );
}
