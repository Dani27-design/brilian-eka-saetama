"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import {
  Maintenance,
  MaintenanceStatus,
  InspectionChecklist,
} from "@/types/maintenances";
import { ProductType } from "@/types/product";
import { useAdmin } from "@/app/context/AdminContext";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import { formatToWIBExport } from "@/utils/dateFormatter";
import { findProductLocation, ProductDetail } from "@/utils/findProductLocation";
import React from "react";
import PhotoGalleryModal from "@/components/Admin/Inspections/PhotoGalleryModal";
import InspectionsTable from "@/components/Admin/Inspections/InspectionsTable";
import InspectionFiltersComponent, { InspectionFilters } from "@/components/Admin/Inspections/InspectionFilters";
import { InspectionTableRow } from "@/components/Admin/Inspections/InspectionPageContent";

export default function WaitingApprovalPage() {
  const { user } = useAdmin();
  usePageHeader("Menunggu Approval", "Inspeksi yang membutuhkan persetujuan admin");

  const [inspections, setInspections] = useState<InspectionTableRow[]>([]);
  const [filteredInspections, setFilteredInspections] = useState<InspectionTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const defaultFilters: InspectionFilters = {
    search: "",
    productType: "",
    status: "waiting_approval", // Fixed — this page only shows waiting_approval
    dateFrom: "",
    dateTo: "",
    sortBy: "inspectionDate",
    sortOrder: "desc",
  };

  const [filters, setFilters] = useState<InspectionFilters>(defaultFilters);

  const handleClearFilters = () => {
    setFilters({ ...defaultFilters, search: filters.search });
  };

  // Pagination (client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Photo gallery
  const [photoGallery, setPhotoGallery] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);

  // Export modal (for single inspection report)

  // Client-side pagination calculations
  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInspections = filteredInspections.slice(indexOfFirstItem, indexOfLastItem);

  const buildInspectionRow = async (docId: string, maintenanceData: Maintenance): Promise<InspectionTableRow> => {
    const [contractSnap, productSnap] = await Promise.all([
      maintenanceData.contract ? getDoc(maintenanceData.contract) : null,
      maintenanceData.product ? getDoc(maintenanceData.product) : null,
    ]);

    let contractNumber = "N/A", contractName = "N/A", location = "N/A", customerName = "N/A";
    let productDetails: ProductDetail[] = [];

    if (contractSnap?.exists()) {
      const d = contractSnap.data();
      contractNumber = d.contractNumber || "N/A";
      contractName = d.contractName || "N/A";
      productDetails = d.productDetails || [];
      if (d.customer) {
        try {
          const customerSnap = await getDoc(d.customer);
          if (customerSnap.exists()) customerName = (customerSnap.data() as any).name || "N/A";
        } catch { /* ignore */ }
      }
    }

    let productNumber = "N/A", productName = "N/A", productBrand = "N/A", brandType = "N/A", capacity = "N/A", expirationDate = "N/A";

    if (productSnap?.exists()) {
      const d = productSnap.data();
      const raw = d.productNumber;
      if (raw !== null && raw !== undefined) productNumber = String(raw).trim() || "N/A";
      productName = d.name || "N/A";
      productBrand = d.specs?.brand || "N/A";
      brandType = d.specs?.brandType || "N/A";
      capacity = d.specs?.capacity || "N/A";
      if (d.specs?.expirationDate) expirationDate = formatToWIBExport(d.specs.expirationDate);
      location = findProductLocation(maintenanceData.product, productDetails);
    }

    const engineerNames: string[] = [];
    let inspectorName = "N/A";

    if (Array.isArray(maintenanceData.engineer) && maintenanceData.engineer.length > 0) {
      const results = await Promise.all(
        maintenanceData.engineer.map(async (ref) => {
          try { const s = await getDoc(ref); return s.exists() ? s.data().name || s.id : null; } catch { return null; }
        })
      );
      engineerNames.push(...results.filter((n) => n !== null));
    }

    if (maintenanceData.inspection?.createdBy) {
      try { const s = await getDoc(maintenanceData.inspection.createdBy); inspectorName = s.exists() ? s.data().name || s.id : "N/A"; } catch { inspectorName = "N/A"; }
    }

    const checklist = maintenanceData.inspection?.checklist || [];

    return {
      id: docId,
      contractNumber, contractName, customerName, productNumber, productName, productBrand, brandType, capacity,
      productType: maintenanceData.productType, expirationDate, location,
      inspectionDate: formatToWIBExport(maintenanceData.inspection?.createdAt),
      inspectionDateRaw: maintenanceData.inspection?.createdAt
        ? (typeof maintenanceData.inspection.createdAt === 'object' && 'toDate' in maintenanceData.inspection.createdAt
            ? (maintenanceData.inspection.createdAt as any).toDate()
            : new Date(maintenanceData.inspection.createdAt as any))
        : null,
      inspectorName, engineerNames,
      checklistSummary: {
        totalItems: checklist.length,
        okCount: checklist.filter((i: any) => i.status === true).length,
        nokCount: checklist.filter((i: any) => i.status === false).length,
      },
      checklistDetails: checklist,
      photos: maintenanceData.inspection?.photos || [],
      status: maintenanceData.status,
      hasInspection: maintenanceData.inspection !== null,
      canApprove: maintenanceData.status === "waiting_approval",
      maintenance: maintenanceData,
    };
  };

  const fetchInspections = async () => {
    try {
      setLoading(true);
      setError("");

      // Simple query — only filter by status (no composite index needed)
      // Filter inspection.createdAt != null client-side to avoid index requirements
      const baseQuery = query(
        collection(firestore, "maintenances"),
        where("status", "==", "waiting_approval")
      );

      const snapshot = await getDocs(baseQuery);

      if (snapshot.empty) {
        setInspections([]);
        return;
      }

      // Client-side filter: only include docs that have inspection data
      const docsWithInspection = snapshot.docs.filter((d) => {
        const data = d.data();
        return data.inspection && data.inspection.createdAt;
      });

      if (docsWithInspection.length === 0) {
        setInspections([]);
        return;
      }

      const rows = await Promise.all(
        docsWithInspection.map(async (d) => {
          try { return await buildInspectionRow(d.id, d.data() as Maintenance); } catch { return null; }
        })
      );

      // Sort by inspection date descending (client-side)
      const validRows = rows.filter((r) => r !== null) as InspectionTableRow[];
      validRows.sort((a, b) => {
        const dateA = a.inspectionDateRaw?.getTime() || 0;
        const dateB = b.inspectionDateRaw?.getTime() || 0;
        return dateB - dateA;
      });
      setInspections(validRows);
    } catch (error: any) {
      setError(error.message || "Terjadi kesalahan saat memuat data");
      setInspections([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...inspections];

    if (filters.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter((i) =>
        i.contractNumber.toLowerCase().includes(term) ||
        i.productNumber.toLowerCase().includes(term) ||
        i.productName.toLowerCase().includes(term)
      );
    }

    if (filters.productType) {
      filtered = filtered.filter((i) => i.productType === filters.productType);
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom); fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((i) => i.inspectionDateRaw && i.inspectionDateRaw >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo); toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((i) => i.inspectionDateRaw && i.inspectionDateRaw <= toDate);
    }

    setFilteredInspections(filtered);
  };

  const updateMaintenanceStatus = async (id: string, status: string) => {
    setActionLoading(id); setError("");
    try {
      await updateDoc(doc(firestore, "maintenances", id), { status, updatedAt: serverTimestamp() });
      // Remove item from list since it's no longer waiting_approval
      setInspections((prev) => prev.filter((item) => item.id !== id));
    } catch (error: any) {
      setError(error.message || "Gagal memperbarui status");
    } finally {
      setActionLoading(null);
    }
  };

  const openPhotoGallery = (photos: string[], startIndex: number = 0) => {
    setPhotoGallery(photos); setCurrentPhotoIndex(startIndex); setIsPhotoGalleryOpen(true);
  };

  useEffect(() => { fetchInspections(); }, []);
  useEffect(() => { applyFilters(); setCurrentPage(1); }, [inspections, filters]);

  return (
    <div className="flex h-full flex-col">
      {error && (
        <div className="mb-4 flex-shrink-0 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="break-words whitespace-pre-wrap">{error}</p>
        </div>
      )}

      <div className="mb-4">
        <InspectionFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
          inspectionCount={inspections.length}
          filteredCount={filteredInspections.length}
        />
      </div>

      <InspectionsTable
          inspections={inspections}
          filteredInspections={currentInspections}
          loading={loading}
          filterProductType=""
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          hasNextPage={currentPage < totalPages}
          totalCount={filteredInspections.length}
          isLoadingCount={false}
          isLoadingMore={false}
          actionLoading={actionLoading}
          certificateLoading={null}
          countCacheTimestamp={Date.now()}
          COUNT_CACHE_DURATION={0}
          onUpdateStatus={updateMaintenanceStatus}
          onGenerateCertificate={() => {}}
          onGenerateReport={() => {}}
          onOpenPhotoGallery={openPhotoGallery}
          onFetchInspections={(page: number) => setCurrentPage(page)}
          onFetchTotalCount={() => {}}
          onSetItemsPerPage={(size: number) => { setItemsPerPage(size); setCurrentPage(1); }}
          onSetCurrentPage={setCurrentPage}
        />

      <PhotoGalleryModal
        photoGallery={photoGallery}
        isPhotoGalleryOpen={isPhotoGalleryOpen}
        onClosePhotoGallery={() => { setPhotoGallery([]); setCurrentPhotoIndex(0); setIsPhotoGalleryOpen(false); }}
        currentPhotoIndex={currentPhotoIndex}
        onSetPhotoIndex={setCurrentPhotoIndex}
      />

    </div>
  );
}
