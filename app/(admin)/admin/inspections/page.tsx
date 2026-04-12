/**
 * @deprecated This page is replaced by product-type-specific inspection pages:
 *   - /admin/apar-inspections
 *   - /admin/hydrant-inspections
 *   - /admin/fire-alarm-inspections
 * Kept as backup only. Do NOT edit or update this file.
 */
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  getDoc,
  DocumentSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
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

/**
 * Represents an inspection row in the table with all necessary display data
 */
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

const defaultFilters: InspectionFilters = {
  search: "",
  productType: "APAR", // Special default for inspections
  status: "",
  dateFrom: "",
  dateTo: "",
  sortBy: "inspectionDate",
  sortOrder: "desc",
};

/**
 * Main component for displaying and managing inspections
 */
export default function InspectionsPage() {
  const { user } = useAdmin();
  usePageHeader("Manajemen Inspeksi", "Kelola dan review hasil inspeksi maintenance");
  const [inspections, setInspections] = useState<InspectionTableRow[]>([]);
  const [filteredInspections, setFilteredInspections] = useState<
    InspectionTableRow[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Filter state
  const [filters, setFilters] = useState<InspectionFilters>(defaultFilters);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [lastDocRef, setLastDocRef] = useState<DocumentSnapshot | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [countCacheTimestamp, setCountCacheTimestamp] = useState<number | null>(
    null
  );
  const COUNT_CACHE_DURATION = 5 * 60 * 1000;

  // Photo gallery states
  const [photoGallery, setPhotoGallery] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Certificate modal state
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);

  // Certificate loading states (shared)
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>("");
  const [certificateLoading, setCertificateLoading] = useState<string | null>(
    null
  );

  // Handle filter clear (preserveSearch pattern + restore APAR default)
  const handleClearFilters = () => {
    setFilters({
      ...defaultFilters,
      search: filters.search, // Preserve search text
    });
  };

  /**
   * Fetches total count of inspections for pagination display
   */
  const fetchTotalCount = async (forceRefresh: boolean = false) => {
    const now = Date.now();

    if (
      !forceRefresh &&
      totalCount !== null &&
      countCacheTimestamp !== null &&
      now - countCacheTimestamp < COUNT_CACHE_DURATION &&
      !isLoadingCount
    ) {
      return;
    }

    try {
      setIsLoadingCount(true);

      const countQuery = query(
        collection(firestore, "maintenances"),
        where("inspection.createdAt", "!=", null)
      );

      const countSnapshot = await getCountFromServer(countQuery);
      const count = countSnapshot.data().count;

      setTotalCount(count);
      setCountCacheTimestamp(now);
    } catch (error: any) {
      if (hasNextPage) {
        setTotalCount(currentPage * itemsPerPage + itemsPerPage);
      } else {
        setTotalCount(
          (currentPage - 1) * itemsPerPage + filteredInspections.length
        );
      }
      setCountCacheTimestamp(now);
    } finally {
      setIsLoadingCount(false);
    }
  };

  /**
   * Fetches ALL inspections within date range for export
   */
  const fetchInspectionsForExport = async (
    startDate?: Date,
    endDate?: Date
  ): Promise<InspectionTableRow[]> => {
    try {
      let exportQuery: any;

      if (startDate && endDate) {
        const startTimestamp = Timestamp.fromDate(startDate);
        const endTimestamp = Timestamp.fromDate(endDate);

        exportQuery = query(
          collection(firestore, "maintenances"),
          where("inspection.createdAt", "!=", null),
          where("inspection.createdAt", ">=", startTimestamp),
          where("inspection.createdAt", "<=", endTimestamp),
          orderBy("inspection.createdAt", "asc")
        );
      } else if (startDate) {
        const startTimestamp = Timestamp.fromDate(startDate);

        exportQuery = query(
          collection(firestore, "maintenances"),
          where("inspection.createdAt", "!=", null),
          where("inspection.createdAt", ">=", startTimestamp),
          orderBy("inspection.createdAt", "asc")
        );
      } else if (endDate) {
        const endTimestamp = Timestamp.fromDate(endDate);

        exportQuery = query(
          collection(firestore, "maintenances"),
          where("inspection.createdAt", "!=", null),
          where("inspection.createdAt", "<=", endTimestamp),
          orderBy("inspection.createdAt", "asc")
        );
      } else {
        exportQuery = query(
          collection(firestore, "maintenances"),
          where("inspection.createdAt", "!=", null),
          orderBy("inspection.createdAt", "asc")
        );
      }

      const exportSnapshot = await getDocs(exportQuery);

      if (exportSnapshot.empty) {
        return [];
      }

      const inspectionRowPromises = exportSnapshot.docs.map(
        async (maintenanceDoc) => {
          const maintenanceData = maintenanceDoc.data() as Maintenance;

          try {
            const [contractSnap, productSnap] = await Promise.all([
              maintenanceData.contract
                ? getDoc(maintenanceData.contract)
                : null,
              maintenanceData.product ? getDoc(maintenanceData.product) : null,
            ]);

            let contractNumber = "N/A";
            let contractName = "N/A";
            let location = "N/A";
            let productDetails: ProductDetail[] = [];

            if (contractSnap?.exists()) {
              const contractData = contractSnap.data();
              contractNumber = contractData.contractNumber || "N/A";
              contractName = contractData.contractName || "N/A";
              productDetails = contractData.productDetails || [];
            }

            let productNumber = "N/A";
            let productName = "N/A";
            let productBrand = "N/A";
            let brandType = "N/A";
            let capacity = "N/A";
            let expirationDate = "N/A";

            if (productSnap?.exists()) {
              const productData = productSnap.data();

              const rawProductNumber = productData.productNumber;
              if (rawProductNumber !== null && rawProductNumber !== undefined) {
                productNumber = String(rawProductNumber).trim() || "N/A";
              }

              productName = productData.name || "N/A";
              productBrand = productData.specs?.brand || "N/A";
              brandType = productData.specs?.brandType || "N/A";
              capacity = productData.specs?.capacity || "N/A";

              if (productData.specs?.expirationDate) {
                expirationDate = formatToWIBExport(
                  productData.specs.expirationDate
                );
              }

              location = findProductLocation(
                maintenanceData.product,
                productDetails
              );
            }

            const engineerNames: string[] = [];
            let inspectorName = "N/A";

            const fetchTasks: Promise<void>[] = [];

            if (
              Array.isArray(maintenanceData.engineer) &&
              maintenanceData.engineer.length > 0
            ) {
              const engineerTask = Promise.all(
                maintenanceData.engineer.map(async (engineerRef) => {
                  try {
                    const engineerSnap = await getDoc(engineerRef);
                    return engineerSnap.exists()
                      ? engineerSnap.data().name || engineerSnap.id
                      : null;
                  } catch {
                    return null;
                  }
                })
              ).then((results) => {
                engineerNames.push(
                  ...results.filter((name) => name !== null)
                );
              });
              fetchTasks.push(engineerTask);
            }

            if (maintenanceData.inspection?.createdBy) {
              const inspectorTask = getDoc(maintenanceData.inspection.createdBy)
                .then((inspectorSnap) => {
                  inspectorName = inspectorSnap.exists()
                    ? inspectorSnap.data().name || inspectorSnap.id
                    : "N/A";
                })
                .catch(() => {
                  inspectorName = "N/A";
                });
              fetchTasks.push(inspectorTask);
            }

            if (fetchTasks.length > 0) {
              await Promise.all(fetchTasks);
            }

            const checklist = maintenanceData.inspection?.checklist || [];
            const checklistSummary = {
              totalItems: checklist.length,
              okCount: checklist.filter((item: any) => item.status === true)
                .length,
              nokCount: checklist.filter((item: any) => item.status === false)
                .length,
            };

            const inspectionDate = formatToWIBExport(
              maintenanceData.inspection?.createdAt
            );

            return {
              id: maintenanceDoc.id,
              contractNumber,
              contractName,
              productNumber,
              productName,
              productBrand,
              brandType,
              capacity,
              productType: maintenanceData.productType,
              expirationDate,
              location,
              inspectionDate,
              inspectorName,
              engineerNames,
              checklistSummary,
              checklistDetails: checklist,
              photos: maintenanceData.inspection?.photos || [],
              status: maintenanceData.status,
              hasInspection: maintenanceData.inspection !== null,
              canApprove: maintenanceData.status === "waiting_approval",
              maintenance: maintenanceData,
            };
          } catch (error) {
            return null;
          }
        }
      );

      const inspectionRows = await Promise.all(inspectionRowPromises);
      return inspectionRows.filter(
        (row) => row !== null
      ) as InspectionTableRow[];
    } catch (error: any) {
      throw new Error(`Failed to fetch export data: ${error.message}`);
    }
  };

  /**
   * Executes query with fallback strategies
   */
  const executeQueryWithFallbacks = async (
    baseQuery: any,
    pageNum: number
  ): Promise<{
    docs: any[];
    lastDoc: DocumentSnapshot | null;
    hasMore: boolean;
  }> => {
    let snapshot;

    try {
      snapshot = await getDocs(baseQuery);
      const docs = snapshot.docs;
      const lastDoc = docs.length > 0 ? docs[docs.length - 1] : null;
      const hasMore = docs.length === itemsPerPage;

      return { docs, lastDoc, hasMore };
    } catch (error: any) {
      setError("Gagal memuat data inspeksi");
      return { docs: [], lastDoc: null, hasMore: false };
    }
  };

  /**
   * Fetches inspections from Firestore with pagination
   */
  const fetchInspections = async (pageNum: number = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      setError("");

      let baseQuery = query(
        collection(firestore, "maintenances"),
        where("inspection.createdAt", "!=", null),
        orderBy("inspection.createdAt", "desc"),
        limit(itemsPerPage)
      );

      if (pageNum > 1 && lastDocRef) {
        baseQuery = query(
          collection(firestore, "maintenances"),
          where("inspection.createdAt", "!=", null),
          orderBy("inspection.createdAt", "desc"),
          startAfter(lastDocRef),
          limit(itemsPerPage)
        );
      }

      const { docs, lastDoc, hasMore } = await executeQueryWithFallbacks(
        baseQuery,
        pageNum
      );

      if (docs.length === 0) {
        setInspections([]);
        setFilteredInspections([]);
        setHasNextPage(false);
        setLastDocRef(null);
        setCurrentPage(1);
        return;
      }

      const inspectionRowPromises = docs.map(async (maintenanceDoc) => {
        const maintenanceData = maintenanceDoc.data() as Maintenance;

        try {
          const [contractSnap, productSnap] = await Promise.all([
            maintenanceData.contract ? getDoc(maintenanceData.contract) : null,
            maintenanceData.product ? getDoc(maintenanceData.product) : null,
          ]);

          let contractNumber = "N/A";
          let contractName = "N/A";
          let location = "N/A";
          let productDetails: ProductDetail[] = [];

          if (contractSnap?.exists()) {
            const contractData = contractSnap.data();
            contractNumber = contractData.contractNumber || "N/A";
            contractName = contractData.contractName || "N/A";
            productDetails = contractData.productDetails || [];
          }

          let productNumber = "N/A";
          let productName = "N/A";
          let productBrand = "N/A";
          let brandType = "N/A";
          let capacity = "N/A";
          let expirationDate = "N/A";

          if (productSnap?.exists()) {
            const productData = productSnap.data();

            const rawProductNumber = productData.productNumber;
            if (rawProductNumber !== null && rawProductNumber !== undefined) {
              productNumber = String(rawProductNumber).trim() || "N/A";
            }

            productName = productData.name || "N/A";
            productBrand = productData.specs?.brand || "N/A";
            brandType = productData.specs?.brandType || "N/A";
            capacity = productData.specs?.capacity || "N/A";

            if (productData.specs?.expirationDate) {
              expirationDate = formatToWIBExport(
                productData.specs.expirationDate
              );
            }

            location = findProductLocation(
              maintenanceData.product,
              productDetails
            );
          }

          const engineerNames: string[] = [];
          if (
            Array.isArray(maintenanceData.engineer) &&
            maintenanceData.engineer.length > 0
          ) {
            const engineerResults = await Promise.all(
              maintenanceData.engineer.map(async (engineerRef) => {
                try {
                  const engineerSnap = await getDoc(engineerRef);
                  return engineerSnap.exists()
                    ? engineerSnap.data().name || engineerSnap.id
                    : null;
                } catch {
                  return null;
                }
              })
            );
            engineerNames.push(
              ...engineerResults.filter((name) => name !== null)
            );
          }

          const checklist = maintenanceData.inspection?.checklist || [];
          const checklistSummary = {
            totalItems: checklist.length,
            okCount: checklist.filter((item: any) => item.status === true)
              .length,
            nokCount: checklist.filter((item: any) => item.status === false)
              .length,
          };

          const inspectionDate = formatToWIBExport(
            maintenanceData.inspection?.createdAt
          );

          return {
            id: maintenanceDoc.id,
            contractNumber,
            contractName,
            productNumber,
            productName,
            productBrand,
            brandType,
            capacity,
            productType: maintenanceData.productType,
            expirationDate,
            location,
            inspectionDate,
            engineerNames,
            checklistSummary,
            checklistDetails: checklist,
            photos: maintenanceData.inspection?.photos || [],
            status: maintenanceData.status,
            hasInspection: maintenanceData.inspection !== null,
            canApprove: maintenanceData.status === "waiting_approval",
            maintenance: maintenanceData,
          };
        } catch (error) {
          return null;
        }
      });

      const inspectionRows = await Promise.all(inspectionRowPromises);
      const validRows = inspectionRows.filter(
        (row) => row !== null
      ) as InspectionTableRow[];

      setInspections(validRows);
      setLastDocRef(lastDoc);
      setHasNextPage(hasMore);
      setCurrentPage(pageNum);
    } catch (error: any) {
      setError(error.message || "Terjadi kesalahan saat memuat data");
      setInspections([]);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  /**
   * Applies client-side filters to the inspections
   */
  const applyFilters = () => {
    let filtered = [...inspections];

    if (filters.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(
        (inspection) =>
          inspection.contractNumber.toLowerCase().includes(term) ||
          inspection.productNumber.toLowerCase().includes(term) ||
          inspection.productName.toLowerCase().includes(term)
      );
    }

    if (filters.productType) {
      filtered = filtered.filter(
        (inspection) => inspection.productType === filters.productType
      );
    }

    if (filters.status) {
      filtered = filtered.filter(
        (inspection) => inspection.status === filters.status
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((inspection) => {
        const inspDate = new Date(inspection.inspectionDate);
        return inspDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((inspection) => {
        const inspDate = new Date(inspection.inspectionDate);
        return inspDate <= toDate;
      });
    }

    setFilteredInspections(filtered);
  };

  /**
   * Updates maintenance status (approve/reject)
   */
  const updateMaintenanceStatus = async (id: string, status: string) => {
    setActionLoading(id);
    setError("");

    try {
      const maintenanceRef = doc(firestore, "maintenances", id);
      await updateDoc(maintenanceRef, {
        status,
        updatedAt: serverTimestamp(),
      });

      setInspections((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: status as MaintenanceStatus, canApprove: false }
            : item
        )
      );
    } catch (error: any) {
      setError(error.message || "Gagal memperbarui status");
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Handles single certificate generation
   */
  const handleGenerateCertificate = async (inspection: InspectionTableRow) => {
    if (inspection.status !== "approved") {
      setError(
        "Sertifikat hanya dapat dibuat untuk inspeksi yang sudah disetujui"
      );
      return;
    }

    setCertificateLoading(inspection.id);
    setError("");

    try {
      const maintenanceSnap = await getDoc(
        doc(firestore, "maintenances", inspection.id)
      );
      if (!maintenanceSnap.exists()) {
        throw new Error("Data maintenance tidak ditemukan");
      }
      const maintenanceData = maintenanceSnap.data() as Maintenance;

      let contractData: any = {};
      if (maintenanceData.contract) {
        const contractSnap = await getDoc(maintenanceData.contract);
        if (contractSnap.exists()) {
          contractData = contractSnap.data();

          if (contractData.customer) {
            const customerSnap = await getDoc(contractData.customer);
            if (customerSnap.exists()) {
              contractData.customerData = customerSnap.data();
            }
          }
        }
      }

      let productData: any = {};
      if (maintenanceData.product) {
        const productSnap = await getDoc(maintenanceData.product);
        if (productSnap.exists()) {
          productData = productSnap.data();
        }
      }

      const approverName = user?.name || user?.email || "Administrator";

      const certificateData = createCertificateData(
        maintenanceData,
        contractData,
        productData,
        inspection.engineerNames,
        approverName,
        inspection.location
      );

      const validation = validateCertificateData(certificateData);
      if (!validation.isValid) {
        throw new Error(
          `Data tidak valid untuk sertifikat: ${validation.errors.join(", ")}`
        );
      }

      if (validation.warnings.length > 0) {
        console.warn("Certificate warnings:", validation.warnings);
      }

      const filename = `certificate_${inspection.productNumber}_${
        new Date().toISOString().split("T")[0]
      }`;

      const inspectorId =
        maintenanceData.inspection?.createdBy?.id || "unknown";
      const approverId = user?.uid || "unknown";

      await printPDFCertificate(
        certificateData,
        inspectorId,
        approverId,
        filename
      );
    } catch (error: any) {
      setError(error.message || "Gagal membuat sertifikat PDF");
    } finally {
      setCertificateLoading(null);
    }
  };

  /**
   * Opens photo gallery
   */
  const openPhotoGallery = (photos: string[], startIndex: number = 0) => {
    setPhotoGallery(photos);
    setCurrentPhotoIndex(startIndex);
    setIsPhotoGalleryOpen(true);
  };

  useEffect(() => {
    fetchInspections(1);
    fetchTotalCount();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [inspections, filters]);

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

      {/* Filters & Actions */}
      <div className="mb-4">
        <InspectionFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearFilters}
          inspectionCount={inspections.length}
          filteredCount={filteredInspections.length}
          onExportData={() => setIsExportModalOpen(true)}
          onExportCertificate={() => setIsCertificateModalOpen(true)}
        />
      </div>

      <InspectionsTable
        inspections={inspections}
        filteredInspections={filteredInspections}
        loading={loading}
        filterProductType={filters.productType}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        hasNextPage={hasNextPage}
        totalCount={totalCount}
        isLoadingCount={isLoadingCount}
        isLoadingMore={isLoadingMore}
        actionLoading={actionLoading}
        certificateLoading={certificateLoading}
        countCacheTimestamp={countCacheTimestamp}
        COUNT_CACHE_DURATION={COUNT_CACHE_DURATION}
        onUpdateStatus={updateMaintenanceStatus}
        onGenerateCertificate={handleGenerateCertificate}
        onOpenPhotoGallery={openPhotoGallery}
        onFetchInspections={fetchInspections}
        onFetchTotalCount={fetchTotalCount}
        onSetItemsPerPage={setItemsPerPage}
        onSetCurrentPage={setCurrentPage}
      />

      <PhotoGalleryModal
        photoGallery={photoGallery}
        isPhotoGalleryOpen={isPhotoGalleryOpen}
        onClosePhotoGallery={() => {
          setPhotoGallery([]);
          setCurrentPhotoIndex(0);
          setIsPhotoGalleryOpen(false);
        }}
        currentPhotoIndex={currentPhotoIndex}
        onSetPhotoIndex={setCurrentPhotoIndex}
      />

      <ExportDataModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        allInspections={filters.productType ? inspections.filter((i) => i.productType === filters.productType) : inspections}
        filteredInspections={filteredInspections}
        filterProductType={filters.productType}
        filterStatus={filters.status}
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
