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
  Timestamp,
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
import {
  createCertificateData,
  printPDFCertificate,
  validateCertificateData,
} from "@/utils/pdfCertificate";
import React from "react";
import PhotoGalleryModal from "@/components/Admin/Inspections/PhotoGalleryModal";
import ExportDataModal from "@/components/Admin/Inspections/ExportDataModal";
import CertificateModal from "@/components/Admin/Inspections/CertificateModal";
import InspectionsTable from "@/components/Admin/Inspections/InspectionsTable";
import InspectionFiltersComponent, {
  InspectionFilters,
} from "@/components/Admin/Inspections/InspectionFilters";

export interface InspectionTableRow {
  id: string;
  contractNumber: string;
  contractName: string;
  productNumber: string;
  productName: string;
  productBrand: string;
  brandType?: string;
  capacity?: string;
  productType: ProductType;
  expirationDate: string;
  location: string;
  inspectionDate: string;
  inspectorName?: string;
  engineerNames: string[];
  checklistSummary: {
    totalItems: number;
    okCount: number;
    nokCount: number;
  };
  checklistDetails: InspectionChecklist;
  photos: string[];
  status: MaintenanceStatus;
  hasInspection: boolean;
  canApprove: boolean;
  maintenance: Maintenance;
}

const productTypeLabels: Record<string, { title: string; subtitle: string }> = {
  APAR: { title: "Inspeksi APAR", subtitle: "Kelola dan review hasil inspeksi APAR" },
  HYDRANT: { title: "Inspeksi Hydrant", subtitle: "Kelola dan review hasil inspeksi Hydrant" },
  FIRE_ALARM: { title: "Inspeksi Fire Alarm", subtitle: "Kelola dan review hasil inspeksi Fire Alarm" },
};

interface InspectionPageContentProps {
  productType: ProductType;
}

export default function InspectionPageContent({ productType }: InspectionPageContentProps) {
  const { user } = useAdmin();
  const labels = productTypeLabels[productType] || { title: `Inspeksi ${productType}`, subtitle: `Kelola inspeksi ${productType}` };
  usePageHeader(labels.title, labels.subtitle);

  const [inspections, setInspections] = useState<InspectionTableRow[]>([]);
  const [filteredInspections, setFilteredInspections] = useState<InspectionTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const defaultFilters: InspectionFilters = {
    search: "",
    productType: productType, // Fixed to the page's product type
    status: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "inspectionDate",
    sortOrder: "desc",
  };

  const [filters, setFilters] = useState<InspectionFilters>(defaultFilters);

  // Pagination (client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Photo gallery
  const [photoGallery, setPhotoGallery] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);

  // Export/Certificate
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>("");
  const [certificateLoading, setCertificateLoading] = useState<string | null>(null);

  const handleClearFilters = () => {
    setFilters({ ...defaultFilters, search: filters.search });
  };

  // Client-side pagination calculations
  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInspections = filteredInspections.slice(indexOfFirstItem, indexOfLastItem);

  const fetchInspectionsForExport = async (startDate?: Date, endDate?: Date): Promise<InspectionTableRow[]> => {
    try {
      const constraints: any[] = [
        where("inspection.createdAt", "!=", null),
      ];

      if (startDate) constraints.push(where("inspection.createdAt", ">=", Timestamp.fromDate(startDate)));
      if (endDate) constraints.push(where("inspection.createdAt", "<=", Timestamp.fromDate(endDate)));
      constraints.push(orderBy("inspection.createdAt", "asc"));

      const exportQuery = query(collection(firestore, "maintenances"), ...constraints);
      const exportSnapshot = await getDocs(exportQuery);

      if (exportSnapshot.empty) return [];

      const rows = await Promise.all(
        exportSnapshot.docs.map(async (maintenanceDoc) => {
          const maintenanceData = maintenanceDoc.data() as Maintenance;
          try {
            return await buildInspectionRow(maintenanceDoc.id, maintenanceData);
          } catch {
            return null;
          }
        })
      );
      return rows.filter((r) => r !== null) as InspectionTableRow[];
    } catch (error: any) {
      throw new Error(`Failed to fetch export data: ${error.message}`);
    }
  };

  const buildInspectionRow = async (docId: string, maintenanceData: Maintenance): Promise<InspectionTableRow> => {
    const [contractSnap, productSnap] = await Promise.all([
      maintenanceData.contract ? getDoc(maintenanceData.contract) : null,
      maintenanceData.product ? getDoc(maintenanceData.product) : null,
    ]);

    let contractNumber = "N/A", contractName = "N/A", location = "N/A";
    let productDetails: ProductDetail[] = [];

    if (contractSnap?.exists()) {
      const d = contractSnap.data();
      contractNumber = d.contractNumber || "N/A";
      contractName = d.contractName || "N/A";
      productDetails = d.productDetails || [];
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
      contractNumber, contractName, productNumber, productName, productBrand, brandType, capacity,
      productType: maintenanceData.productType, expirationDate, location,
      inspectionDate: formatToWIBExport(maintenanceData.inspection?.createdAt),
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

      const baseQuery = query(
        collection(firestore, "maintenances"),
        where("inspection.createdAt", "!=", null),
        orderBy("inspection.createdAt", "desc")
      );

      const snapshot = await getDocs(baseQuery);

      if (snapshot.empty) {
        setInspections([]);
        return;
      }

      const rows = await Promise.all(
        snapshot.docs.map(async (d) => {
          try { return await buildInspectionRow(d.id, d.data() as Maintenance); } catch { return null; }
        })
      );
      setInspections(rows.filter((r) => r !== null) as InspectionTableRow[]);
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

    // productType is already filtered at query level, but keep for safety
    if (filters.productType) {
      filtered = filtered.filter((i) => i.productType === filters.productType);
    }

    if (filters.status) {
      filtered = filtered.filter((i) => i.status === filters.status);
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom); fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((i) => new Date(i.inspectionDate) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo); toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((i) => new Date(i.inspectionDate) <= toDate);
    }

    setFilteredInspections(filtered);
  };

  const updateMaintenanceStatus = async (id: string, status: string) => {
    setActionLoading(id); setError("");
    try {
      await updateDoc(doc(firestore, "maintenances", id), { status, updatedAt: serverTimestamp() });
      setInspections((prev) => prev.map((item) =>
        item.id === id ? { ...item, status: status as MaintenanceStatus, canApprove: false } : item
      ));
    } catch (error: any) {
      setError(error.message || "Gagal memperbarui status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateCertificate = async (inspection: InspectionTableRow) => {
    if (inspection.status !== "approved") {
      setError("Sertifikat hanya dapat dibuat untuk inspeksi yang sudah disetujui");
      return;
    }
    setCertificateLoading(inspection.id); setError("");
    try {
      // Fetch fresh data from Firestore (same as backup page)
      const maintenanceSnap = await getDoc(doc(firestore, "maintenances", inspection.id));
      if (!maintenanceSnap.exists()) throw new Error("Data maintenance tidak ditemukan");
      const maintenanceData = maintenanceSnap.data() as Maintenance;

      let contractData: any = {};
      if (maintenanceData.contract) {
        const contractSnap = await getDoc(maintenanceData.contract);
        if (contractSnap.exists()) {
          contractData = contractSnap.data();
          if (contractData.customer) {
            const customerSnap = await getDoc(contractData.customer);
            if (customerSnap.exists()) contractData.customerData = customerSnap.data();
          }
        }
      }

      let productData: any = {};
      if (maintenanceData.product) {
        const productSnap = await getDoc(maintenanceData.product);
        if (productSnap.exists()) productData = productSnap.data();
      }

      const approverName = user?.name || user?.email || "Administrator";

      const certData = createCertificateData(
        maintenanceData,
        contractData,
        productData,
        inspection.engineerNames,
        approverName,
        inspection.location
      );

      const validation = validateCertificateData(certData);
      if (!validation.isValid) {
        setError(`Data sertifikat tidak lengkap: ${validation.errors.join(", ")}`);
        return;
      }

      const inspectorId = maintenanceData.inspection?.createdBy?.id || "unknown";
      const approverId = user?.uid || "unknown";
      const filename = `Sertifikat_${inspection.productType}_${inspection.productNumber}_${inspection.contractNumber}`;
      await printPDFCertificate(certData, inspectorId, approverId, filename);
    } catch (error: any) {
      setError(error.message || "Gagal membuat sertifikat PDF");
    } finally {
      setCertificateLoading(null);
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
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {exportProgress && (
        <div className="mb-4 rounded-lg border border-stroke bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <div className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <p className="text-sm font-medium text-gray-700">{exportProgress}</p>
          </div>
        </div>
      )}

      <div className="mb-4">
        <InspectionFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
          inspectionCount={inspections.length}
          filteredCount={filteredInspections.length}
          onExportData={() => setIsExportModalOpen(true)}
          onExportCertificate={() => setIsCertificateModalOpen(true)}
          fixedProductType={productType}
        />
      </div>

      <InspectionsTable
        inspections={inspections}
        filteredInspections={currentInspections}
        loading={loading}
        filterProductType={productType}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        hasNextPage={currentPage < totalPages}
        totalCount={filteredInspections.length}
        isLoadingCount={false}
        isLoadingMore={false}
        actionLoading={actionLoading}
        certificateLoading={certificateLoading}
        countCacheTimestamp={Date.now()}
        COUNT_CACHE_DURATION={0}
        onUpdateStatus={updateMaintenanceStatus}
        onGenerateCertificate={handleGenerateCertificate}
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

      <ExportDataModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        filteredInspections={filteredInspections}
        filterProductType={productType}
        filterStatus={filters.status}
        fetchInspectionsForExport={fetchInspectionsForExport}
        onError={setError}
      />

      <CertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        filteredInspections={filteredInspections}
        fetchInspectionsForExport={fetchInspectionsForExport}
        user={user}
        onError={setError}
        onSetExportLoading={setExportLoading}
        onSetExportProgress={setExportProgress}
        exportLoading={exportLoading}
      />
    </div>
  );
}
