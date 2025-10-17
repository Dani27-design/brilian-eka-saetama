"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { collection, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { Maintenance, MaintenanceStatus } from "@/types/maintenances";
import { ProductType } from "@/types/product";
import { useAdmin } from "@/app/context/AdminContext";

// Import our new optimized components and utilities
import MaintenanceFiltersComponent, { MaintenanceFilters } from "@/components/Admin/Maintenances/MaintenanceFilters";
import SortableMaintenanceHeader from "@/components/Admin/Maintenances/SortableMaintenanceHeader";
import MaintenanceBulkOperationsToolbar from "@/components/Admin/Maintenances/MaintenanceBulkOperationsToolbar";
import { buildMaintenanceQuery, canUseMaintenanceFirestoreSort } from "@/utils/maintenanceQuery";
import { loadMaintenancesWithRelatedData, loadAvailableEngineers, loadAvailableContracts, createPerformanceMonitor, MaintenanceTableRow } from "@/utils/maintenanceDataLoader";
import { filterAndSortMaintenances, createDefaultMaintenanceFilters, resetMaintenanceFilters } from "@/utils/maintenanceFilters";
import { downloadMaintenanceExport, DEFAULT_MAINTENANCE_EXPORT_CONFIG } from "@/utils/maintenanceExportGenerator";

// Import existing components we'll reuse
import Modal from "@/components/Admin/Modal";
import Image from "next/image";
import moment from "moment";
import "moment/locale/id";

const statusColor: Record<MaintenanceStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  pending: "bg-gray-100 text-gray-700", 
  waiting_approval: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const statusDisplay: Record<MaintenanceStatus, string> = {
  scheduled: "Dijadwalkan",
  pending: "Tertunda",
  waiting_approval: "Menunggu Disetujui", 
  approved: "Disetujui",
  rejected: "Ditolak",
};

export default function MaintenancesPage() {
  const { user } = useAdmin();
  
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

  // Placeholder functions for bulk operations (to be implemented)
  const handleBulkStatusUpdate = () => {
    console.log("Bulk status update for:", selectedMaintenances);
  };

  const handleBulkEngineerAssignment = () => {
    console.log("Bulk engineer assignment for:", selectedMaintenances);
  };

  const handleBulkDelete = () => {
    console.log("Bulk delete for:", selectedMaintenances);
  };

  // Get available product types from loaded data
  const availableProductTypes = useMemo(() => {
    const types = new Set<ProductType>();
    allMaintenances.forEach(m => types.add(m.productType));
    return Array.from(types);
  }, [allMaintenances]);

  return (
    <div className="shadow-default rounded-sm border border-stroke bg-white p-4 md:p-6 xl:p-7.5">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Manajemen Pemeliharaan</h2>
          <p className="mt-1 text-sm text-gray-500">
            Kelola jadwal pemeliharaan dengan sistem yang dioptimalkan
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800">
          <p>{error}</p>
          <button
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
            onClick={() => setError("")}
          >
            Tutup
          </button>
        </div>
      )}

      {/* Enhanced Bulk Operations Toolbar */}
      <MaintenanceBulkOperationsToolbar
        selectedCount={selectedMaintenances.size}
        onExport={handleExport}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        onBulkEngineerAssignment={handleBulkEngineerAssignment}
        onBulkDelete={handleBulkDelete}
        onClearSelection={clearSelection}
        loading={loading}
      />

      {/* Advanced Filters */}
      <MaintenanceFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        maintenanceCount={allMaintenances.length}
        filteredCount={filteredMaintenances.length}
        availableEngineers={availableEngineers}
        availableContracts={availableContracts}
        availableProductTypes={availableProductTypes}
      />

      {/* Main Table Section */}
      <div className="rounded-lg border border-stroke bg-white p-4">
        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-2">Memuat maintenance...</p>
          </div>
        ) : filteredMaintenances.length === 0 ? (
          <div className="py-8 text-center">
            <p>Tidak ada maintenance yang ditemukan.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b bg-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-black">
                    <th className="px-2 py-3 w-12">
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
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-2 py-3">Kontrak</th>
                    <th className="px-2 py-3">Produk</th>
                    <SortableMaintenanceHeader
                      sortKey="startDate"
                      currentSort={filters.sortBy}
                      currentOrder={filters.sortOrder}
                      onSort={handleSort}
                    >
                      Periode
                    </SortableMaintenanceHeader>
                    <th className="px-2 py-3">Teknisi</th>
                    <th className="px-2 py-3">Inspeksi</th>
                    <SortableMaintenanceHeader
                      sortKey="status"
                      currentSort={filters.sortBy}
                      currentOrder={filters.sortOrder}
                      onSort={handleSort}
                    >
                      Status
                    </SortableMaintenanceHeader>
                    <th className="px-2 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMaintenances.map((maintenance) => (
                    <tr 
                      key={maintenance.id} 
                      className={`text-sm hover:bg-gray-50 ${
                        selectedMaintenances.has(maintenance.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-2 py-3">
                        <input
                          type="checkbox"
                          checked={selectedMaintenances.has(maintenance.id)}
                          onChange={() => toggleMaintenanceSelection(maintenance.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{maintenance.contractNumber}</span>
                          <span className="text-xs text-gray-500">{maintenance.contractName}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <span className="font-medium">{maintenance.productNumber}</span>
                            <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800">
                              {maintenance.productType}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{maintenance.productName}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-col">
                          <span>
                            {maintenance.startDate
                              ? moment(maintenance.startDate).format("DD MMMM YYYY")
                              : "-"}
                          </span>
                          <span className="text-xs text-gray-500">
                            s/d{" "}
                            {maintenance.endDate
                              ? moment(maintenance.endDate).format("DD MMMM YYYY")
                              : "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-col">
                          {maintenance.engineers.length > 0 && (
                            <div className="mb-1 flex flex-wrap gap-1">
                              {maintenance.engineers.map((eng) => (
                                <span
                                  key={eng.id}
                                  className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs"
                                >
                                  {eng.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {maintenance.engineers.length === 0 && (
                            <span className="text-xs text-gray-500">Belum ditugaskan</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        {maintenance.hasInspection ? (
                          <span className="inline-block rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                            Sudah diinspeksi
                          </span>
                        ) : (
                          <span className="inline-block rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                            Belum diinspeksi
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1">
                          <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${statusColor[maintenance.status]}`}>
                            {statusDisplay[maintenance.status]}
                          </span>
                          
                          {maintenance.status === "waiting_approval" && maintenance.hasInspection && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => updateMaintenanceStatus(maintenance.id, "approved")}
                                disabled={actionLoading === maintenance.id}
                                className="rounded bg-green-500 px-2 py-1 text-xs font-medium text-white hover:bg-green-600"
                              >
                                {actionLoading === maintenance.id ? "..." : "✓"}
                              </button>
                              <button
                                onClick={() => updateMaintenanceStatus(maintenance.id, "rejected")}
                                disabled={actionLoading === maintenance.id}
                                className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
                              >
                                {actionLoading === maintenance.id ? "..." : "✕"}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <a
                          href={`/admin/maintenances/edit/${maintenance.id}`}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Edit
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 flex flex-col items-center justify-between space-y-3 border-t pt-4 sm:flex-row sm:space-y-0">
              <div className="text-xs text-gray-600">
                Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-
                {Math.min(currentPage * itemsPerPage, filteredMaintenances.length)} dari{" "}
                {filteredMaintenances.length} maintenance
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Item per halaman:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border px-2 py-1 text-sm"
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
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : "border-stroke bg-white hover:bg-gray-100"
                  }`}
                >
                  &lt;
                </button>
                <span className="text-sm text-gray-600">
                  Halaman <span className="font-medium">{currentPage}</span> dari {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
                    currentPage === totalPages || totalPages === 0
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : "border-stroke bg-white hover:bg-gray-100"
                  }`}
                >
                  &gt;
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
    </div>
  );
}