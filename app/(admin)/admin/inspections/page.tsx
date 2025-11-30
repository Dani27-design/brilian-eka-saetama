"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  getDoc,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  getCountFromServer,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import Link from "next/link";
import {
  Maintenance,
  MaintenanceStatus,
  InspectionChecklist,
} from "@/types/maintenances";
import { ProductType } from "@/types/product";
import { useAdmin } from "@/app/context/AdminContext";
import Image from "next/image";
import Modal from "@/components/Admin/Modal";
import {
  formatToWIB,
  formatDateOnlyWIB,
  formatToWIBExport,
} from "@/utils/dateFormatter";
import {
  findProductLocation,
  ProductDetail,
} from "@/utils/findProductLocation";
import {
  exportToExcel,
  exportToCSV,
  exportToBoth,
  validateExportData,
  getExportStats,
} from "@/utils/exportInspection";
import {
  createCertificateData,
  printCertificate,
  printPDFCertificate,
  downloadPDFCertificateDirectly,
  validateCertificateData,
  getCertificateStats,
  generateMergedPDFCertificates,
  CertificateData as PDFCertificateData,
} from "@/utils/pdfCertificate";
import {
  convertToCertificateData,
  generateMergedWordCertificates,
  generateWordCertificateHTML,
  downloadWordCertificate,
  CertificateData as WordCertificateData,
} from "@/utils/wordCertificate";
import {
  getChecklistItemsByType,
  getChecklistItemStatus,
  getChecklistItemRemarks,
  getStatusColorClass,
  generateChecklistHeaders,
  getAllProductTypes,
  getProductTypeDisplayName,
} from "@/utils/checklistHelpers";
import React from "react";

/**
 * Represents an inspection row in the table with all necessary display data
 */
interface InspectionTableRow {
  id: string;
  contractNumber: string;
  contractName: string;
  productNumber: string;
  productName: string;
  productBrand: string;
  brandType?: string; // New field for export
  capacity?: string; // New field for export
  productType: ProductType;
  expirationDate: string;
  location: string;
  inspectionDate: string;
  inspectorName?: string; // New field for export
  engineerNames: string[];
  checklistSummary: {
    totalItems: number;
    okCount: number;
    nokCount: number;
  };
  checklistDetails: InspectionChecklist; // Add detailed checklist for dynamic columns
  photos: string[];
  status: MaintenanceStatus;
  hasInspection: boolean;
  canApprove: boolean;
  maintenance: Maintenance;
}

/**
 * Status color mapping for maintenance status badges
 */
const statusColors: Record<MaintenanceStatus, string> = {
  pending: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  waiting_approval: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

/**
 * Status display text in Indonesian
 */
const statusDisplay: Record<MaintenanceStatus, string> = {
  pending: "Tertunda",
  scheduled: "Dijadwalkan",
  waiting_approval: "Menunggu Disetujui",
  approved: "Disetujui",
  rejected: "Ditolak",
};

/**
 * Main component for displaying and managing inspections
 * Shows only maintenances that have inspection data (non-null inspection field)
 *
 * Features:
 * - Display inspection data in table format
 * - Filter by product type, status, date range
 * - Search by contract/product number
 * - Photo preview modal
 * - Approve/reject inspections
 * - Export functionality (placeholder)
 * - Navigation to edit pages
 */
export default function InspectionsPage() {
  const { user } = useAdmin();
  const [inspections, setInspections] = useState<InspectionTableRow[]>([]);
  const [filteredInspections, setFilteredInspections] = useState<
    InspectionTableRow[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProductType, setFilterProductType] = useState<ProductType | "">(
    "APAR",
  ); // Default to APAR
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | "">("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Enhanced pagination states for server-side pagination
  const [lastDocRef, setLastDocRef] = useState<DocumentSnapshot | null>(null);
  const [firstDocRef, setFirstDocRef] = useState<DocumentSnapshot | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pageCache, setPageCache] = useState<Map<number, InspectionTableRow[]>>(
    new Map(),
  );
  const [pageStack, setPageStack] = useState<DocumentSnapshot[]>([]); // For previous page navigation

  // Total count for pagination display with caching
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [countCacheTimestamp, setCountCacheTimestamp] = useState<number | null>(
    null,
  );
  const COUNT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Photo modal
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Photo gallery modal
  const [photoGallery, setPhotoGallery] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);

  // Export modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"excel" | "csv">("excel");

  // Certificate modal
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [certificateFormat, setCertificateFormat] = useState<"pdf" | "doc">(
    "pdf",
  );
  const [certificateDateFrom, setCertificateDateFrom] = useState("");
  const [certificateDateTo, setCertificateDateTo] = useState("");

  // Export states
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>("");

  // Export date filter states
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");

  // Certificate generation states
  const [certificateLoading, setCertificateLoading] = useState<string | null>(
    null,
  );

  /**
   * Fetches total count of inspections for pagination display
   * Uses efficient Firestore count query with 5-minute caching
   */
  const fetchTotalCount = async (forceRefresh: boolean = false) => {
    const now = Date.now();

    // Check cache validity - don't refetch if we have fresh data
    if (
      !forceRefresh &&
      totalCount !== null &&
      countCacheTimestamp !== null &&
      now - countCacheTimestamp < COUNT_CACHE_DURATION &&
      !isLoadingCount
    ) {
      console.log(`📊 Using cached total count: ${totalCount}`);
      return;
    }

    try {
      setIsLoadingCount(true);

      // Use the same query structure as the data fetch for consistency
      const countQuery = query(
        collection(firestore, "maintenances"),
        where("inspection.createdAt", "!=", null),
      );

      const countSnapshot = await getCountFromServer(countQuery);
      const count = countSnapshot.data().count;

      setTotalCount(count);
      setCountCacheTimestamp(now);
      console.log(`📊 Fetched fresh total inspections count: ${count}`);
    } catch (error: any) {
      console.warn(
        "Failed to fetch total count, using fallback approach:",
        error,
      );

      // Fallback: estimate from current data if count query fails
      if (hasNextPage) {
        // If there are more pages, show a conservative estimate
        setTotalCount(currentPage * itemsPerPage + itemsPerPage);
      } else {
        // If this is the last page, calculate exact count
        setTotalCount(
          (currentPage - 1) * itemsPerPage + filteredInspections.length,
        );
      }
      setCountCacheTimestamp(now); // Cache even fallback values to prevent repeated failures
    } finally {
      setIsLoadingCount(false);
    }
  };

  /**
   * Fetches ALL inspections within date range for export
   * Uses database query with date filters instead of client-side filtering
   * @param startDate - Start date for filtering (optional)
   * @param endDate - End date for filtering (optional)
   * @returns Promise<InspectionTableRow[]> - All matching inspection data
   */
  const fetchInspectionsForExport = async (
    startDate?: Date,
    endDate?: Date,
  ): Promise<InspectionTableRow[]> => {
    try {
      console.log(
        `📊 Fetching export data from ${
          startDate?.toISOString() || "beginning"
        } to ${endDate?.toISOString() || "now"}...`,
      );

      // Build query with date filters
      let exportQuery: any;

      if (startDate && endDate) {
        // Query with both start and end date
        const startTimestamp = Timestamp.fromDate(startDate);
        const endTimestamp = Timestamp.fromDate(endDate);

        exportQuery = query(
          collection(firestore, "maintenances"),
          where("inspection.createdAt", "!=", null),
          where("inspection.createdAt", ">=", startTimestamp),
          where("inspection.createdAt", "<=", endTimestamp),
          orderBy("inspection.createdAt", "asc"), // Use ascending order as requested
        );
      } else if (startDate) {
        // Query with only start date
        const startTimestamp = Timestamp.fromDate(startDate);

        exportQuery = query(
          collection(firestore, "maintenances"),
          where("inspection.createdAt", "!=", null),
          where("inspection.createdAt", ">=", startTimestamp),
          orderBy("inspection.createdAt", "asc"),
        );
      } else if (endDate) {
        // Query with only end date
        const endTimestamp = Timestamp.fromDate(endDate);

        exportQuery = query(
          collection(firestore, "maintenances"),
          where("inspection.createdAt", "!=", null),
          where("inspection.createdAt", "<=", endTimestamp),
          orderBy("inspection.createdAt", "asc"),
        );
      } else {
        // Query all inspections
        exportQuery = query(
          collection(firestore, "maintenances"),
          where("inspection.createdAt", "!=", null),
          orderBy("inspection.createdAt", "asc"),
        );
      }

      console.log(`🔍 Executing export query...`);
      const exportSnapshot = await getDocs(exportQuery);
      console.log(`📦 Found ${exportSnapshot.docs.length} records in database`);

      if (exportSnapshot.empty) {
        console.log(`⚠️ No inspection data found for date range`);
        return [];
      }

      // Process all maintenance records in parallel (same logic as fetchInspections)
      const inspectionRowPromises = exportSnapshot.docs.map(
        async (maintenanceDoc) => {
          const maintenanceData = maintenanceDoc.data() as Maintenance;

          try {
            // Fetch contract, product, and engineer data in parallel
            const [contractSnap, productSnap] = await Promise.all([
              maintenanceData.contract
                ? getDoc(maintenanceData.contract)
                : null,
              maintenanceData.product ? getDoc(maintenanceData.product) : null,
            ]);

            // Process contract data
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

            // Process product data with validation and new required fields
            let productNumber = "N/A";
            let productName = "N/A";
            let productBrand = "N/A";
            let brandType = "N/A"; // New field
            let capacity = "N/A"; // New field
            let expirationDate = "N/A";

            if (productSnap?.exists()) {
              const productData = productSnap.data();

              // Validate and ensure productNumber is always a string
              const rawProductNumber = productData.productNumber;
              if (rawProductNumber !== null && rawProductNumber !== undefined) {
                productNumber = String(rawProductNumber).trim() || "N/A";

                // Log if we found non-string productNumber in database
                if (typeof rawProductNumber !== "string") {
                  console.warn(`📋 Database productNumber is not string:`, {
                    type: typeof rawProductNumber,
                    value: rawProductNumber,
                    converted: productNumber,
                    maintenanceId: maintenanceDoc.id,
                  });
                }
              }

              productName = productData.name || "N/A";
              productBrand = productData.specs?.brand || "N/A";
              brandType = productData.specs?.brandType || "N/A";
              capacity = productData.specs?.capacity || "N/A";

              // Format expiration date as DD MMMM YYYY, HH:mm:ss
              if (productData.specs?.expirationDate) {
                expirationDate = formatToWIBExport(
                  productData.specs.expirationDate,
                );
              }

              location = findProductLocation(
                maintenanceData.product,
                productDetails,
              );
            }

            // Fetch engineer data and inspector data in parallel
            const engineerNames: string[] = [];
            let inspectorName = "N/A";

            // Execute fetches in parallel
            const fetchTasks: Promise<void>[] = [];

            // Fetch engineer data
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
                }),
              ).then((results) => {
                engineerNames.push(...results.filter((name) => name !== null));
              });
              fetchTasks.push(engineerTask);
            }

            // Fetch inspector data
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

            // Wait for all fetch operations to complete
            if (fetchTasks.length > 0) {
              await Promise.all(fetchTasks);
            }

            // Calculate checklist summary
            const checklist = maintenanceData.inspection?.checklist || [];
            const checklistSummary = {
              totalItems: checklist.length,
              okCount: checklist.filter((item: any) => item.status === true)
                .length,
              nokCount: checklist.filter((item: any) => item.status === false)
                .length,
            };

            const inspectionDate = formatToWIBExport(
              maintenanceData.inspection?.createdAt,
            );

            return {
              id: maintenanceDoc.id,
              contractNumber,
              contractName,
              productNumber,
              productName,
              productBrand,
              brandType, // Add new field
              capacity, // Add new field
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
              hasInspection: true,
              canApprove: maintenanceData.status === "waiting_approval",
              maintenance: maintenanceData,
            } as InspectionTableRow;
          } catch (rowError) {
            console.error(
              `Error processing maintenance ${maintenanceDoc.id}:`,
              rowError,
            );
            return null; // Return null for failed rows
          }
        },
      );

      // Wait for all rows to be processed and filter out failed ones
      const inspectionRows = (await Promise.all(inspectionRowPromises)).filter(
        (row) => row !== null,
      ) as InspectionTableRow[];

      // Sort by product number in ascending order (client-side sorting with robust type handling)
      let sortedRows: InspectionTableRow[];
      try {
        sortedRows = inspectionRows.sort((a, b) => {
          // Robust type conversion to handle any data type
          const productA = String(a.productNumber ?? "").trim();
          const productB = String(b.productNumber ?? "").trim();

          // Debug logging for problematic data
          if (
            typeof a.productNumber !== "string" &&
            a.productNumber !== null &&
            a.productNumber !== undefined
          ) {
            console.warn(
              `⚠️ Non-string productNumber found:`,
              typeof a.productNumber,
              a.productNumber,
            );
          }

          return productA.localeCompare(productB, "en", {
            numeric: true,
            sensitivity: "base",
          });
        });

        console.log(
          `✅ Successfully sorted ${sortedRows.length} export records by product number`,
        );
      } catch (sortError) {
        console.warn(
          `⚠️ Sorting by productNumber failed, using original order:`,
          sortError,
        );

        // Fallback: return data in original order if sorting fails
        sortedRows = inspectionRows;

        // Log sample data for debugging
        if (inspectionRows.length > 0) {
          console.log(`Debug sample data:`, {
            productNumber: inspectionRows[0].productNumber,
            productNumberType: typeof inspectionRows[0].productNumber,
            sampleRow: {
              id: inspectionRows[0].id,
              contractNumber: inspectionRows[0].contractNumber,
              productNumber: inspectionRows[0].productNumber,
            },
          });
        }
      }

      console.log(
        `✅ Processed ${sortedRows.length} export records successfully`,
      );
      return sortedRows;
    } catch (error: any) {
      console.error("Error fetching export data:", error);

      // Provide specific error messages
      let errorMessage =
        "Gagal mengambil data untuk export. Silakan coba lagi.";

      if (error?.code) {
        switch (error.code) {
          case "failed-precondition":
            errorMessage =
              "Database index diperlukan untuk range tanggal. Hubungi administrator.";
            break;
          case "invalid-argument":
            errorMessage =
              "Filter tanggal tidak valid. Periksa format tanggal.";
            break;
          default:
            if (error.message) {
              errorMessage = `Error: ${error.message}`;
            }
        }
      }

      throw new Error(errorMessage);
    }
  };

  /**
   * Executes maintenance query with progressive fallback strategies
   * Handles Firestore constraint errors and missing indexes gracefully
   */
  const executeQueryWithFallbacks = async (
    pageNum: number,
  ): Promise<QuerySnapshot | null> => {
    try {
      // Strategy 1: Optimal query using inspection.createdAt (requires index)
      console.log("Trying optimized query with inspection.createdAt...");

      let maintenancesQuery = query(
        collection(firestore, "maintenances"),
        where("inspection.createdAt", "!=", null),
        orderBy("inspection.createdAt", "desc"),
        limit(itemsPerPage),
      );

      // For pages beyond 1, use startAfter with the last document from previous page
      if (pageNum > 1 && lastDocRef) {
        maintenancesQuery = query(
          collection(firestore, "maintenances"),
          where("inspection.createdAt", "!=", null),
          orderBy("inspection.createdAt", "desc"),
          startAfter(lastDocRef),
          limit(itemsPerPage),
        );
      }

      return await getDocs(maintenancesQuery);
    } catch (error: any) {
      console.warn("Optimized query failed:", error.code, error.message);

      // Strategy 2: Fallback to status-based filtering (more likely to have index)
      if (
        error.code === "failed-precondition" ||
        error.code === "invalid-argument"
      ) {
        try {
          console.log("Trying fallback query with status filtering...");

          let fallbackQuery = query(
            collection(firestore, "maintenances"),
            where("status", "in", ["waiting_approval", "approved", "rejected"]),
            orderBy("status"),
            orderBy("updatedAt", "desc"),
            limit(itemsPerPage * 2), // Get more docs since we'll filter client-side
          );

          if (pageNum > 1 && lastDocRef) {
            fallbackQuery = query(
              collection(firestore, "maintenances"),
              where("status", "in", [
                "waiting_approval",
                "approved",
                "rejected",
              ]),
              orderBy("status"),
              orderBy("updatedAt", "desc"),
              startAfter(lastDocRef),
              limit(itemsPerPage * 2),
            );
          }

          return await getDocs(fallbackQuery);
        } catch (fallbackError: any) {
          console.warn(
            "Status-based fallback failed:",
            fallbackError.code,
            fallbackError.message,
          );

          // Strategy 3: Simple query without complex filters (last resort)
          try {
            console.log("Trying simple fallback query...");

            let simpleQuery = query(
              collection(firestore, "maintenances"),
              orderBy("updatedAt", "desc"),
              limit(itemsPerPage * 3), // Get even more since we'll filter for inspections client-side
            );

            if (pageNum > 1 && lastDocRef) {
              simpleQuery = query(
                collection(firestore, "maintenances"),
                orderBy("updatedAt", "desc"),
                startAfter(lastDocRef),
                limit(itemsPerPage * 3),
              );
            }

            const simpleSnap = await getDocs(simpleQuery);

            // Filter client-side for documents with inspections
            const docsWithInspections = simpleSnap.docs.filter((doc) => {
              const data = doc.data();
              return data.inspection && data.inspection.createdAt;
            });

            // Create a new QuerySnapshot-like object with filtered docs
            return {
              docs: docsWithInspections.slice(0, itemsPerPage),
              empty: docsWithInspections.length === 0,
              size: docsWithInspections.length,
            } as QuerySnapshot;
          } catch (simpleError) {
            console.error("All query strategies failed:", simpleError);
            throw simpleError;
          }
        }
      } else {
        // Re-throw non-index related errors
        throw error;
      }
    }
  };

  /**
   * Fetches all maintenances with inspections and related data
   * Processes contract, product, and engineer information for display
   */
  const fetchInspections = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError("");

      const maintenancesSnap = await executeQueryWithFallbacks(pageNum);

      if (!maintenancesSnap || maintenancesSnap.empty) {
        setInspections([]);
        setFilteredInspections([]);
        setHasNextPage(false);
        setCurrentPage(pageNum);
        return;
      }
      // Process all maintenance records in parallel for better performance
      const inspectionRowPromises = maintenancesSnap.docs.map(
        async (maintenanceDoc) => {
          const maintenanceData = maintenanceDoc.data() as Maintenance;

          try {
            // Fetch contract, product, and engineer data in parallel
            const [contractSnap, productSnap] = await Promise.all([
              maintenanceData.contract
                ? getDoc(maintenanceData.contract)
                : null,
              maintenanceData.product ? getDoc(maintenanceData.product) : null,
            ]);

            // Process contract data
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

            // Process product data
            let productNumber = "N/A";
            let productName = "N/A";
            let productBrand = "N/A";
            let brandType = "N/A"; // New field for export compatibility
            let capacity = "N/A"; // New field for export compatibility
            let expirationDate = "N/A";

            if (productSnap?.exists()) {
              const productData = productSnap.data();
              productNumber = productData.productNumber || "N/A";
              productName = productData.name || "N/A";
              productBrand = productData.specs?.brand || "N/A";
              brandType = productData.specs?.brandType || "N/A";
              capacity = productData.specs?.capacity || "N/A";

              if (productData.specs?.expirationDate) {
                expirationDate = formatDateOnlyWIB(
                  productData.specs.expirationDate,
                );
              }

              location = findProductLocation(
                maintenanceData.product,
                productDetails,
              );
            }

            // Fetch engineer data in parallel
            const engineerNames: string[] = [];
            let inspectorName = "N/A"; // For export compatibility

            if (
              Array.isArray(maintenanceData.engineer) &&
              maintenanceData.engineer.length > 0
            ) {
              const engineerPromises = maintenanceData.engineer.map(
                async (engineerRef) => {
                  try {
                    const engineerSnap = await getDoc(engineerRef);
                    return engineerSnap.exists()
                      ? engineerSnap.data().name || engineerSnap.id
                      : null;
                  } catch {
                    return null;
                  }
                },
              );

              const engineerResults = await Promise.all(engineerPromises);
              engineerNames.push(
                ...engineerResults.filter((name) => name !== null),
              );
            }

            // Calculate checklist summary
            const checklist = maintenanceData.inspection?.checklist || [];
            const checklistSummary = {
              totalItems: checklist.length,
              okCount: checklist.filter((item: any) => item.status === true)
                .length,
              nokCount: checklist.filter((item: any) => item.status === false)
                .length,
            };

            const inspectionDate = formatToWIB(
              maintenanceData.inspection?.createdAt,
            );

            return {
              id: maintenanceDoc.id,
              contractNumber,
              contractName,
              productNumber,
              productName,
              productBrand,
              brandType, // Add new field
              capacity, // Add new field
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
              hasInspection: true,
              canApprove: maintenanceData.status === "waiting_approval",
              maintenance: maintenanceData,
            } as InspectionTableRow;
          } catch (rowError) {
            console.error(
              `Error processing maintenance ${maintenanceDoc.id}:`,
              rowError,
            );
            return null; // Return null for failed rows
          }
        },
      );

      // Wait for all rows to be processed and filter out failed ones
      const inspectionRows = (await Promise.all(inspectionRowPromises)).filter(
        (row) => row !== null,
      ) as InspectionTableRow[];

      setInspections(inspectionRows);
      setFilteredInspections(inspectionRows);

      // Update pagination state
      if (maintenancesSnap.docs.length > 0) {
        setLastDocRef(maintenancesSnap.docs[maintenancesSnap.docs.length - 1]);
        setHasNextPage(maintenancesSnap.docs.length === itemsPerPage);
      } else {
        setHasNextPage(false);
      }

      setCurrentPage(pageNum);
    } catch (error: any) {
      console.error("Error fetching inspections:", error);

      // Provide specific error messages based on error type
      let errorMessage = "Gagal memuat data inspeksi. Silakan coba lagi.";

      if (error?.code) {
        switch (error.code) {
          case "failed-precondition":
            errorMessage =
              "Database index sedang dibuat. Silakan coba lagi dalam beberapa menit.";
            console.warn(
              "Firestore index not ready. Please create the required index:",
              error.message,
            );
            break;
          case "invalid-argument":
            errorMessage = "Query tidak valid. Tim teknis telah diberitahu.";
            console.error(
              "Invalid Firestore query. Check query structure:",
              error.message,
            );
            break;
          case "permission-denied":
            errorMessage =
              "Tidak memiliki izin untuk mengakses data. Hubungi administrator.";
            break;
          case "unavailable":
            errorMessage =
              "Layanan tidak tersedia sementara. Coba lagi sebentar.";
            break;
          default:
            if (error.message) {
              errorMessage = `Error: ${error.message}`;
            }
        }
      }

      setError(errorMessage);

      // Reset state on error
      setInspections([]);
      setFilteredInspections([]);
      setHasNextPage(false);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  /**
   * Applies filters to the inspections list based on current filter states
   */
  const applyFilters = () => {
    let filtered = [...inspections];

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (inspection) =>
          inspection.contractNumber.toLowerCase().includes(search) ||
          inspection.contractName.toLowerCase().includes(search) ||
          inspection.productNumber.toLowerCase().includes(search) ||
          inspection.productName.toLowerCase().includes(search) ||
          inspection.engineerNames.some((name) =>
            name.toLowerCase().includes(search),
          ),
      );
    }

    // Product type filter
    if (filterProductType) {
      filtered = filtered.filter(
        (inspection) => inspection.productType === filterProductType,
      );
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter(
        (inspection) => inspection.status === filterStatus,
      );
    }

    // Date range filter
    if (filterDateFrom || filterDateTo) {
      filtered = filtered.filter((inspection) => {
        const inspectionDate = new Date(inspection.inspectionDate);

        if (filterDateFrom && inspectionDate < new Date(filterDateFrom)) {
          return false;
        }

        if (
          filterDateTo &&
          inspectionDate > new Date(filterDateTo + "T23:59:59")
        ) {
          return false;
        }

        return true;
      });
    }

    setFilteredInspections(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  /**
   * Updates the status of a maintenance/inspection
   * Used for approve/reject actions
   */
  const updateMaintenanceStatus = async (
    maintenanceId: string,
    newStatus: MaintenanceStatus,
  ) => {
    if (!user?.uid) {
      setError("User tidak terautentikasi");
      return;
    }

    setActionLoading(maintenanceId);

    try {
      const maintenanceRef = doc(firestore, "maintenances", maintenanceId);

      await updateDoc(maintenanceRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: doc(firestore, "users", user.uid),
      });

      // Update local state
      setInspections((prev) =>
        prev.map((inspection) =>
          inspection.id === maintenanceId
            ? {
                ...inspection,
                status: newStatus,
                canApprove: newStatus === "waiting_approval",
              }
            : inspection,
        ),
      );

      // Re-apply filters to update filtered list
      applyFilters();
    } catch (error) {
      console.error("Error updating maintenance status:", error);
      setError("Gagal mengubah status. Silakan coba lagi.");
    } finally {
      setActionLoading(null);
    }
  };

  // Effects
  useEffect(() => {
    fetchInspections(1);
    fetchTotalCount(); // Initial load uses cache
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    searchTerm,
    filterProductType,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    inspections,
  ]);

  // Keyboard navigation for photo gallery
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isPhotoGalleryOpen) return;

      if (event.key === "ArrowLeft") {
        prevPhoto();
      } else if (event.key === "ArrowRight") {
        nextPhoto();
      } else if (event.key === "Escape") {
        closePhotoGallery();
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [isPhotoGalleryOpen, photoGallery.length]);

  // Server-side pagination - no client-side slicing needed
  // Data is already paginated by the server query

  // Photo modal handlers

  const closePhotoModal = () => {
    setSelectedPhoto(null);
    setIsPhotoModalOpen(false);
  };

  // Photo gallery handlers
  const openPhotoGallery = (photos: string[], startIndex: number = 0) => {
    setPhotoGallery(photos);
    setCurrentPhotoIndex(startIndex);
    setIsPhotoGalleryOpen(true);
  };

  const closePhotoGallery = () => {
    setPhotoGallery([]);
    setCurrentPhotoIndex(0);
    setIsPhotoGalleryOpen(false);
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev >= photoGallery.length - 1 ? 0 : prev + 1,
    );
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev <= 0 ? photoGallery.length - 1 : prev - 1,
    );
  };

  /**
   * Handles exporting inspection data to Excel format
   * Uses database query with date range filters to get all matching data
   */
  const handleExportExcel = async () => {
    setExportLoading(true);
    setExportProgress("Memulai export Excel...");
    setError("");

    try {
      // Fetch data from database with date range filter
      let dataToExport: InspectionTableRow[];

      if (exportDateFrom || exportDateTo) {
        // Use database query with date filters
        const startDate = exportDateFrom ? new Date(exportDateFrom) : undefined;
        const endDate = exportDateTo
          ? new Date(exportDateTo + "T23:59:59")
          : undefined;

        setExportProgress("Mengambil data dari database...");
        console.log(
          `📊 Fetching export data with date range: ${
            exportDateFrom || "no start"
          } to ${exportDateTo || "no end"}`,
        );
        dataToExport = await fetchInspectionsForExport(startDate, endDate);
      } else {
        // No date filter - use current filtered inspections from page
        console.log(
          `📊 Using current page data for export (${filteredInspections.length} records)`,
        );
        dataToExport = filteredInspections;
      }

      if (dataToExport.length === 0) {
        setError(
          "Tidak ada data inspeksi untuk diekspor dalam rentang tanggal yang dipilih",
        );
        return;
      }

      setExportProgress(`Memvalidasi ${dataToExport.length} data inspeksi...`);

      // Validate export data
      const validation = validateExportData(dataToExport);
      if (!validation.isValid) {
        setError(`Gagal ekspor Excel: ${validation.errors.join(", ")}`);
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn("Export warnings:", validation.warnings);
      }

      setExportProgress(
        `Membuat file Excel dengan ${dataToExport.length} data...`,
      );
      console.log(
        `📋 Exporting ${dataToExport.length} inspection records to Excel`,
      );
      const exportData = dataToExport;

      // Generate filename with current date and filter info
      const today = new Date().toISOString().split("T")[0];
      let filename = `inspection_export_${today}`;

      if (filterProductType) {
        filename += `_${filterProductType}`;
      }
      if (filterStatus) {
        filename += `_${filterStatus}`;
      }
      if (exportDateFrom && exportDateTo) {
        filename += `_${exportDateFrom}_to_${exportDateTo}`;
      }

      setExportProgress("Mengunduh file Excel...");
      await exportToExcel(exportData, filename);
      setExportProgress("Excel berhasil diunduh!");
    } catch (error: any) {
      console.error("Export Excel error:", error);
      setError(error.message || "Gagal mengekspor data ke Excel");
    } finally {
      setExportLoading(false);
      setExportProgress("");
    }
  };

  /**
   * Handles exporting inspection data to CSV format
   * Uses database query with date range filters to get all matching data
   */
  const handleExportCSV = async () => {
    setExportLoading(true);
    setExportProgress("Memulai export CSV...");
    setError("");

    try {
      // Fetch data from database with date range filter
      let dataToExport: InspectionTableRow[];

      if (exportDateFrom || exportDateTo) {
        // Use database query with date filters
        const startDate = exportDateFrom ? new Date(exportDateFrom) : undefined;
        const endDate = exportDateTo
          ? new Date(exportDateTo + "T23:59:59")
          : undefined;

        setExportProgress("Mengambil data dari database...");
        console.log(
          `📊 Fetching export data with date range: ${
            exportDateFrom || "no start"
          } to ${exportDateTo || "no end"}`,
        );
        dataToExport = await fetchInspectionsForExport(startDate, endDate);
      } else {
        // No date filter - use current filtered inspections from page
        console.log(
          `📊 Using current page data for export (${filteredInspections.length} records)`,
        );
        dataToExport = filteredInspections;
      }

      if (dataToExport.length === 0) {
        setError(
          "Tidak ada data inspeksi untuk diekspor dalam rentang tanggal yang dipilih",
        );
        return;
      }

      setExportProgress(`Memvalidasi ${dataToExport.length} data inspeksi...`);

      // Validate export data
      const validation = validateExportData(dataToExport);
      if (!validation.isValid) {
        setError(`Gagal ekspor CSV: ${validation.errors.join(", ")}`);
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn("Export warnings:", validation.warnings);
      }

      setExportProgress(
        `Membuat file CSV dengan ${dataToExport.length} data...`,
      );
      console.log(
        `📋 Exporting ${dataToExport.length} inspection records to CSV`,
      );
      const exportData = dataToExport;

      // Generate filename with current date and filter info
      const today = new Date().toISOString().split("T")[0];
      let filename = `inspection_export_${today}`;

      if (filterProductType) {
        filename += `_${filterProductType}`;
      }
      if (filterStatus) {
        filename += `_${filterStatus}`;
      }
      if (exportDateFrom && exportDateTo) {
        filename += `_${exportDateFrom}_to_${exportDateTo}`;
      }

      setExportProgress("Mengunduh file CSV...");
      await exportToCSV(exportData, filename);
      setExportProgress("CSV berhasil diunduh!");
    } catch (error: any) {
      console.error("Export CSV error:", error);
      setError(error.message || "Gagal mengekspor data ke CSV");
    } finally {
      setExportLoading(false);
      setExportProgress("");
    }
  };

  /**
   * Handles export from modal based on selected export format
   */
  const handleModalExport = async () => {
    setIsExportModalOpen(false);

    if (exportFormat === "excel") {
      await handleExportExcel();
    } else if (exportFormat === "csv") {
      await handleExportCSV();
    }
  };

  /**
   * Handles certificate export from modal based on selected format and date range
   */
  const handleModalCertificateExport = async () => {
    setIsCertificateModalOpen(false);
    setExportLoading(true);
    setExportProgress("Memulai pembuatan sertifikat...");
    setError("");

    try {
      // Fetch data from database with date range filter
      let dataToExport: InspectionTableRow[];

      if (certificateDateFrom || certificateDateTo) {
        // Use database query with date filters
        const startDate = certificateDateFrom
          ? new Date(certificateDateFrom)
          : undefined;
        const endDate = certificateDateTo
          ? new Date(certificateDateTo + "T23:59:59")
          : undefined;

        setExportProgress("Mengambil data dari database...");
        console.log(
          `📄 Fetching certificate data with date range: ${
            certificateDateFrom || "no start"
          } to ${certificateDateTo || "no end"}`,
        );
        dataToExport = await fetchInspectionsForExport(startDate, endDate);
      } else {
        // No date filter - use current filtered inspections from page
        console.log(
          `📄 Using current page data for certificate export (${filteredInspections.length} records)`,
        );
        dataToExport = filteredInspections;
      }

      // Filter only approved inspections
      const approvedInspections = dataToExport.filter(
        (inspection) => inspection.status === "approved",
      );

      if (approvedInspections.length === 0) {
        setError(
          "Tidak ada inspeksi yang disetujui untuk dibuat sertifikat dalam rentang tanggal yang dipilih",
        );
        return;
      }

      setExportProgress(
        `Membuat sertifikat untuk ${approvedInspections.length} inspeksi...`,
      );

      if (certificateFormat === "doc") {
        // Handle Word document export
        const certificatesData: WordCertificateData[] = [];

        for (let i = 0; i < approvedInspections.length; i++) {
          const inspection = approvedInspections[i];

          try {
            setExportProgress(
              `Memproses sertifikat ${i + 1} dari ${
                approvedInspections.length
              }...`,
            );

            // Fetch complete maintenance data
            const maintenanceSnap = await getDoc(
              doc(firestore, "maintenances", inspection.id),
            );
            if (!maintenanceSnap.exists()) continue;

            const maintenanceData = maintenanceSnap.data() as Maintenance;

            // Fetch contract data
            let contractData: any = {};
            if (maintenanceData.contract) {
              const contractSnap = await getDoc(maintenanceData.contract);
              if (contractSnap.exists()) {
                contractData = contractSnap.data();

                // Fetch customer data if available
                if (contractData.customer) {
                  const customerSnap = await getDoc(contractData.customer);
                  if (customerSnap.exists()) {
                    contractData.customerData = customerSnap.data();
                  }
                }
              }
            }

            // Fetch product data
            let productData: any = {};
            if (maintenanceData.product) {
              const productSnap = await getDoc(maintenanceData.product);
              if (productSnap.exists()) {
                productData = productSnap.data();
              }
            }

            // Create certificate data for Word format
            const certificateData = convertToCertificateData(
              inspection,
              contractData,
              productData,
              maintenanceData,
            );

            certificatesData.push(certificateData);
          } catch (error) {
            console.error(`Error processing certificate ${i + 1}:`, error);
            // Continue with next certificate
          }
        }

        if (certificatesData.length === 0) {
          setError("Tidak dapat membuat sertifikat Word - data tidak lengkap");
          return;
        }

        setExportProgress("Membuat dokumen Word...");

        // Generate filename
        const today = new Date().toISOString().split("T")[0];
        let filename = `certificates_${today}`;

        if (certificateDateFrom && certificateDateTo) {
          filename += `_${certificateDateFrom}_to_${certificateDateTo}`;
        }

        // Generate merged Word document
        if (certificatesData.length === 1) {
          const htmlContent = generateWordCertificateHTML(certificatesData[0]);
          downloadWordCertificate(htmlContent, filename);
        } else {
          generateMergedWordCertificates(certificatesData, filename);
        }

        setExportProgress("Sertifikat Word berhasil diunduh!");
      } else {
        // Handle PDF export with merged output
        const certificatesData: PDFCertificateData[] = [];
        const approverName = user?.name || user?.email || "Administrator";

        for (let i = 0; i < approvedInspections.length; i++) {
          const inspection = approvedInspections[i];

          try {
            setExportProgress(
              `Memproses sertifikat PDF ${i + 1} dari ${
                approvedInspections.length
              }...`,
            );

            // Fetch complete maintenance data
            const maintenanceSnap = await getDoc(
              doc(firestore, "maintenances", inspection.id),
            );
            if (!maintenanceSnap.exists()) continue;

            const maintenanceData = maintenanceSnap.data() as Maintenance;

            // Fetch contract data
            let contractData: any = {};
            if (maintenanceData.contract) {
              const contractSnap = await getDoc(maintenanceData.contract);
              if (contractSnap.exists()) {
                contractData = contractSnap.data();

                // Fetch customer data if available
                if (contractData.customer) {
                  const customerSnap = await getDoc(contractData.customer);
                  if (customerSnap.exists()) {
                    contractData.customerData = customerSnap.data();
                  }
                }
              }
            }

            // Fetch product data
            let productData: any = {};
            if (maintenanceData.product) {
              const productSnap = await getDoc(maintenanceData.product);
              if (productSnap.exists()) {
                productData = productSnap.data();
              }
            }

            // Create certificate data
            const certificateData = createCertificateData(
              maintenanceData,
              contractData,
              productData,
              inspection.engineerNames,
              approverName,
              inspection.location,
            );

            certificatesData.push(certificateData);
          } catch (error) {
            console.error(`Error processing certificate ${i + 1}:`, error);
            // Continue with next certificate
          }
        }

        if (certificatesData.length === 0) {
          setError("Tidak dapat membuat sertifikat PDF - data tidak lengkap");
          return;
        }

        setExportProgress("Membuat sertifikat PDF...");

        // Generate filename
        const today = new Date().toISOString().split("T")[0];
        let filename = `certificates_${today}`;

        if (certificateDateFrom && certificateDateTo) {
          filename += `_${certificateDateFrom}_to_${certificateDateTo}`;
        }

        // Get inspector and approver IDs for QR signatures (use first certificate's data)
        const firstInspection = approvedInspections[0];
        const firstMaintenanceSnap = await getDoc(
          doc(firestore, "maintenances", firstInspection.id),
        );
        const firstMaintenanceData = firstMaintenanceSnap.exists()
          ? (firstMaintenanceSnap.data() as Maintenance)
          : null;
        const inspectorId =
          firstMaintenanceData?.inspection?.createdBy?.id || "unknown";
        const approverId = user?.uid || "unknown";

        // Generate merged PDF with QR signatures
        await generateMergedPDFCertificates(
          certificatesData,
          inspectorId,
          approverId,
          filename,
        );

        setExportProgress("Sertifikat PDF berhasil diunduh!");
      }
    } catch (error: any) {
      console.error("Certificate export error:", error);
      setError(error.message || "Gagal membuat sertifikat");
    } finally {
      setExportLoading(false);
      setExportProgress("");
    }
  };

  /**
   * Handles PDF certificate generation for approved inspections
   * Fetches all necessary data and creates a professional inspection certificate
   *
   * @param inspection - The inspection row data
   */
  const handleGenerateCertificate = async (inspection: InspectionTableRow) => {
    if (inspection.status !== "approved") {
      setError(
        "Sertifikat hanya dapat dibuat untuk inspeksi yang sudah disetujui",
      );
      return;
    }

    setCertificateLoading(inspection.id);
    setError("");

    try {
      // Fetch complete maintenance data
      const maintenanceSnap = await getDoc(
        doc(firestore, "maintenances", inspection.id),
      );
      if (!maintenanceSnap.exists()) {
        throw new Error("Data maintenance tidak ditemukan");
      }
      const maintenanceData = maintenanceSnap.data() as Maintenance;

      // Fetch contract data
      let contractData: any = {};
      if (maintenanceData.contract) {
        const contractSnap = await getDoc(maintenanceData.contract);
        if (contractSnap.exists()) {
          contractData = contractSnap.data();

          // Fetch customer data if available
          if (contractData.customer) {
            const customerSnap = await getDoc(contractData.customer);
            if (customerSnap.exists()) {
              contractData.customerData = customerSnap.data();
            }
          }
        }
      }

      // Fetch product data
      let productData: any = {};
      if (maintenanceData.product) {
        const productSnap = await getDoc(maintenanceData.product);
        if (productSnap.exists()) {
          productData = productSnap.data();
        }
      }

      // Get approver name (current user)
      const approverName = user?.name || user?.email || "Administrator";

      // Create certificate data
      const certificateData = createCertificateData(
        maintenanceData,
        contractData,
        productData,
        inspection.engineerNames,
        approverName,
        inspection.location,
      );

      // Validate certificate data
      const validation = validateCertificateData(certificateData);
      if (!validation.isValid) {
        throw new Error(
          `Data tidak valid untuk sertifikat: ${validation.errors.join(", ")}`,
        );
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn("Certificate warnings:", validation.warnings);
      }

      // Generate filename
      const filename = `certificate_${inspection.productNumber}_${
        new Date().toISOString().split("T")[0]
      }`;

      // Get inspector and approver IDs for QR signatures
      const inspectorId =
        maintenanceData.inspection?.createdBy?.id || "unknown";
      const approverId = user?.uid || "unknown";

      // Generate and download PDF with QR signatures
      await printPDFCertificate(
        certificateData,
        inspectorId,
        approverId,
        filename,
      );
    } catch (error: any) {
      console.error("Certificate generation error:", error);
      setError(error.message || "Gagal membuat sertifikat PDF");
    } finally {
      setCertificateLoading(null);
    }
  };

  /**
   * Handles bulk certificate generation for approved inspections within date range
   */
  const handleBulkCertificateDownload = async () => {
    setExportLoading(true);
    setError("");

    try {
      // Filter approved inspections within date range
      let approvedInspections = filteredInspections.filter(
        (inspection) => inspection.status === "approved",
      );

      if (exportDateFrom || exportDateTo) {
        approvedInspections = approvedInspections.filter((inspection) => {
          const inspectionDate = new Date(inspection.inspectionDate);

          if (exportDateFrom && inspectionDate < new Date(exportDateFrom)) {
            return false;
          }

          if (
            exportDateTo &&
            inspectionDate > new Date(exportDateTo + "T23:59:59")
          ) {
            return false;
          }

          return true;
        });
      }

      if (approvedInspections.length === 0) {
        setError(
          "Tidak ada inspeksi yang disetujui dalam rentang tanggal yang dipilih",
        );
        return;
      }

      // Generate certificates for each approved inspection
      for (let i = 0; i < approvedInspections.length; i++) {
        const inspection = approvedInspections[i];

        try {
          // Fetch complete maintenance data
          const maintenanceSnap = await getDoc(
            doc(firestore, "maintenances", inspection.id),
          );
          if (!maintenanceSnap.exists()) continue;

          const maintenanceData = maintenanceSnap.data() as Maintenance;

          // Fetch contract data
          let contractData: any = {};
          if (maintenanceData.contract) {
            const contractSnap = await getDoc(maintenanceData.contract);
            if (contractSnap.exists()) {
              contractData = contractSnap.data();

              // Fetch customer data if available
              if (contractData.customer) {
                const customerSnap = await getDoc(contractData.customer);
                if (customerSnap.exists()) {
                  contractData.customerData = customerSnap.data();
                }
              }
            }
          }

          // Fetch product data
          let productData: any = {};
          if (maintenanceData.product) {
            const productSnap = await getDoc(maintenanceData.product);
            if (productSnap.exists()) {
              productData = productSnap.data();
            }
          }

          // Get approver name (current user)
          const approverName = user?.name || user?.email || "Administrator";

          // Create certificate data
          const certificateData = createCertificateData(
            maintenanceData,
            contractData,
            productData,
            inspection.engineerNames,
            approverName,
            inspection.location,
          );

          // Validate certificate data
          const validation = validateCertificateData(certificateData);
          if (!validation.isValid) continue;

          // Generate filename
          const filename = `certificate_${inspection.productNumber}_${
            new Date(inspection.inspectionDate).toISOString().split("T")[0]
          }`;

          // Get inspector and approver IDs for QR signatures
          const inspectorId =
            maintenanceData.inspection?.createdBy?.id || "unknown";
          const approverId = user?.uid || "unknown";

          // Generate and download certificate (with delay to prevent browser blocking)
          await new Promise((resolve) => setTimeout(resolve, 1000 * i)); // 1 second delay between downloads
          await downloadPDFCertificateDirectly(
            certificateData,
            inspectorId,
            approverId,
            filename,
          );
        } catch (error) {
          console.error(
            `Error generating certificate for inspection ${inspection.id}:`,
            error,
          );
          continue;
        }
      }
    } catch (error: any) {
      console.error("Bulk certificate generation error:", error);
      setError(error.message || "Gagal membuat sertifikat dalam jumlah besar");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="shadow-default rounded-sm border border-stroke bg-white p-4 md:p-6 xl:p-7.5">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Manajemen Inspeksi</h2>
          <p className="mt-1 text-sm text-gray-500">
            Kelola dan review hasil inspeksi maintenance
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
          {/* Export Buttons */}
          {filteredInspections.length > 0 && (
            <>
              <button
                onClick={() => setIsExportModalOpen(true)}
                disabled={exportLoading}
                className="inline-flex items-center rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                title="Export data inspeksi"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {exportLoading ? "Exporting..." : "Ekspor Data"}
              </button>

              <button
                onClick={() => setIsCertificateModalOpen(true)}
                disabled={exportLoading}
                className="inline-flex items-center rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                title="Export certificates"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {exportLoading ? "Generating..." : "Unduh Sertifikat"}
              </button>
            </>
          )}

          <button
            onClick={() => {
              setTotalCount(null);
              setCountCacheTimestamp(null); // Invalidate cache on manual refresh
              fetchInspections(1);
              fetchTotalCount(true); // Force refresh
            }}
            disabled={loading}
            className="inline-flex items-center rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {loading ? "Memuat..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error Message */}
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

      {/* Filters */}
      <div className="mb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Cari inspeksi...
            </label>
            <input
              type="text"
              placeholder="Kontrak, produk, engineer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-stroke px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Product Type Filter */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Tipe Produk & Kolom Checklist
            </label>
            <select
              value={filterProductType}
              onChange={(e) =>
                setFilterProductType(e.target.value as ProductType | "")
              }
              className="w-full rounded-lg border border-stroke px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Semua Tipe</option>
              <option value="APAR">APAR</option>
              <option value="HYDRANT">HYDRANT</option>
              <option value="CCTV">CCTV</option>
              <option value="FIRE_ALARM">FIRE ALARM</option>
              <option value="ACCESS_DOOR">ACCESS DOOR</option>
              <option value="PATROL_GUARD">PATROL GUARD</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as MaintenanceStatus | "")
              }
              className="w-full rounded-lg border border-stroke px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Semua Status</option>
              <option value="scheduled">Dijadwalkan</option>
              <option value="waiting_approval">Menunggu Disetujui</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Tanggal Dari
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full rounded-lg border border-stroke px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Tanggal Sampai
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full rounded-lg border border-stroke px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Results Summary & Export Info */}
      {!loading && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-600">
            Menampilkan {filteredInspections.length} inspeksi pada halaman{" "}
            {currentPage}
            {filteredInspections.length !== inspections.length &&
              ` (difilter dari ${inspections.length} total)`}
          </div>

          {filteredInspections.length > 0 && (
            <div className="text-xs text-gray-500">
              {(() => {
                const stats = getExportStats(filteredInspections);
                return (
                  <span>
                    Export akan mencakup {stats.totalInspections} inspeksi dari{" "}
                    {stats.contractCount} kontrak
                    {filterDateFrom && filterDateTo && (
                      <span>
                        {" "}
                        | Rentang: {filterDateFrom} - {filterDateTo}
                      </span>
                    )}
                  </span>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-stroke bg-white p-4">
        {loading ? (
          <div className="py-8 text-center">Memuat inspeksi...</div>
        ) : filteredInspections.length === 0 ? (
          <div className="py-8 text-center">
            {inspections.length === 0
              ? "Tidak ada data inspeksi."
              : "Tidak ada inspeksi yang sesuai dengan filter."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b bg-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-black">
                    <th className="px-2 py-3">Produk & Kontrak</th>
                    <th className="px-2 py-3">Lokasi</th>
                    <th className="px-2 py-3">Inspeksi</th>

                    {/* Dynamic Checklist Columns */}
                    {filterProductType &&
                      getChecklistItemsByType(filterProductType).map((item) => (
                        <th
                          key={item}
                          className="min-w-24 px-2 py-3 text-center"
                        >
                          {item}
                        </th>
                      ))}

                    <th className="px-2 py-3">Foto</th>
                    <th className="px-2 py-3">Status</th>
                    <th className="px-2 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInspections.map((inspection) => (
                    <tr key={inspection.id} className="text-sm">
                      <td className="px-2 py-3">
                        <div className="flex flex-col">
                          {/* Product Information */}
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

                          {/* Contract Information */}
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

                      <td className="px-2 py-3">
                        <span className="text-sm">{inspection.location}</span>
                      </td>

                      <td className="px-2 py-3">
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

                      {/* Dynamic Checklist Columns */}
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
                              <td key={item} className="px-2 py-3 text-center">
                                <div className="flex flex-col items-center">
                                  {/* Status Icon */}
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

                                    {/* Remarks - show for all statuses when provided, default message only for missing status */}
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

                      <td className="px-2 py-3">
                        <div className="flex flex-col items-center">
                          {inspection.photos.length > 0 ? (
                            <>
                              <button
                                onClick={() =>
                                  openPhotoGallery(inspection.photos, 0)
                                }
                                className="group relative"
                              >
                                <Image
                                  src={inspection.photos[0]}
                                  alt={`Foto inspeksi`}
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

                      <td className="px-2 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                              statusColors[inspection.status]
                            }`}
                          >
                            {statusDisplay[inspection.status]}
                          </span>

                          {inspection.canApprove && (
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  updateMaintenanceStatus(
                                    inspection.id,
                                    "approved",
                                  )
                                }
                                disabled={actionLoading === inspection.id}
                                className="rounded bg-green-500 px-2 py-1 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
                              >
                                {actionLoading === inspection.id ? "..." : "✓"}
                              </button>
                              <button
                                onClick={() =>
                                  updateMaintenanceStatus(
                                    inspection.id,
                                    "rejected",
                                  )
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

                      <td className="px-2 py-3">
                        <div className="flex flex-col gap-1">
                          <Link
                            href={`/admin/inspections/edit/${inspection.id}`}
                            className="inline-flex w-16 items-center justify-center rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200"
                          >
                            Edit
                          </Link>

                          {inspection.status === "approved" && (
                            <button
                              onClick={() =>
                                handleGenerateCertificate(inspection)
                              }
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

            {/* Pagination */}
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
                    onChange={(e) => {
                      const newPageSize = Number(e.target.value);
                      setItemsPerPage(newPageSize);
                      setCurrentPage(1);
                      // Reset pagination state and fetch new data
                      setLastDocRef(null);
                      setHasNextPage(false);
                      setPageCache(new Map());
                      setPageStack([]);
                      setTotalCount(null); // Reset total count to refetch with new page size
                      setCountCacheTimestamp(null); // Invalidate count cache
                      fetchInspections(1);
                      fetchTotalCount(true); // Force refresh with new page size
                    }}
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
                        fetchInspections(currentPage - 1);
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
                        fetchInspections(currentPage + 1);
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

      {/* Photo Modal */}
      <Modal
        isOpen={isPhotoModalOpen}
        onClose={closePhotoModal}
        title="Detail Foto Inspeksi"
      >
        {selectedPhoto && (
          <div className="flex justify-center">
            <Image
              src={selectedPhoto}
              alt="Foto inspeksi"
              width={800}
              height={600}
              className="max-h-[80vh] w-auto object-contain"
            />
          </div>
        )}
      </Modal>

      {/* Photo Gallery Modal */}
      <Modal
        isOpen={isPhotoGalleryOpen}
        onClose={closePhotoGallery}
        title={`Galeri Foto Inspeksi (${currentPhotoIndex + 1}/${
          photoGallery.length
        })`}
      >
        {photoGallery.length > 0 && (
          <div className="flex flex-col items-center">
            {/* Main Photo */}
            <div className="relative flex justify-center">
              <Image
                src={photoGallery[currentPhotoIndex]}
                alt={`Foto inspeksi ${currentPhotoIndex + 1}`}
                width={800}
                height={600}
                className="max-h-[70vh] w-auto rounded object-contain"
              />

              {/* Navigation Arrows */}
              {photoGallery.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                  >
                    <svg
                      className="h-6 w-6"
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
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                  >
                    <svg
                      className="h-6 w-6"
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
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {photoGallery.length > 1 && (
              <div className="mt-4 flex max-w-full flex-wrap justify-center gap-2 overflow-x-auto">
                {photoGallery.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`relative flex-shrink-0 rounded border-2 ${
                      index === currentPhotoIndex
                        ? "border-blue-500"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <Image
                      src={photo}
                      alt={`Thumbnail ${index + 1}`}
                      width={60}
                      height={60}
                      className="h-15 w-15 rounded object-cover"
                    />
                    {index === currentPhotoIndex && (
                      <div className="absolute inset-0 rounded bg-blue-500/20"></div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Navigation Info */}
            <div className="mt-3 text-sm text-gray-600">
              Gunakan tombol panah atau klik thumbnail untuk navigasi
            </div>
          </div>
        )}
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Data Inspeksi"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">
              Pilih format file dan rentang tanggal untuk mengekspor data
              inspeksi.
            </p>
          </div>

          {/* Format Selection */}
          <div className="rounded-lg border border-gray-200 p-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Format Export
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="excel"
                  checked={exportFormat === "excel"}
                  onChange={(e) =>
                    setExportFormat(e.target.value as "excel" | "csv")
                  }
                  className="mr-2 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">
                  Excel (.xlsx) - Recommended untuk analisis data
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === "csv"}
                  onChange={(e) =>
                    setExportFormat(e.target.value as "excel" | "csv")
                  }
                  className="mr-2 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">
                  CSV (.csv) - Universal format untuk sistem lain
                </span>
              </label>
            </div>
          </div>

          {/* Date Filter */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={exportDateFrom}
                  onChange={(e) => setExportDateFrom(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="dd/mm/yyyy"
                />
              </div>

              <div className="flex items-center justify-center text-sm text-gray-500 sm:px-3">
                sampai
              </div>

              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={exportDateTo}
                  onChange={(e) => setExportDateTo(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="dd/mm/yyyy"
                />
              </div>
            </div>
          </div>

          {/* Export Progress */}
          {exportLoading && exportProgress && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm">
              <div className="flex items-center">
                <div className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600"></div>
                <p className="font-medium text-blue-800">{exportProgress}</p>
              </div>
            </div>
          )}

          {/* Summary Info */}
          {!exportLoading &&
            (exportDateFrom ||
              exportDateTo ||
              filteredInspections.length > 0) && (
              <div className="rounded-lg bg-gray-50 p-3 text-sm">
                <p className="font-medium text-gray-700">Informasi Export:</p>
                <p className="text-blue-600">
                  Format:{" "}
                  {exportFormat === "excel" ? "Excel (.xlsx)" : "CSV (.csv)"}
                </p>
                {(exportDateFrom || exportDateTo) && (
                  <p className="text-blue-600">
                    Data akan diambil dari database berdasarkan rentang tanggal
                    yang dipilih
                  </p>
                )}
                {!(exportDateFrom || exportDateTo) && (
                  <p className="text-blue-600">
                    Tanpa filter tanggal, akan menggunakan data halaman saat
                    ini: {filteredInspections.length} inspeksi
                  </p>
                )}
              </div>
            )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsExportModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={handleModalExport}
              disabled={exportLoading}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                exportFormat === "excel"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-50`}
            >
              {exportLoading
                ? "Processing..."
                : exportFormat === "excel"
                ? "Export Excel"
                : "Export CSV"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Certificate Export Modal */}
      <Modal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        title="Export Sertifikat Inspeksi"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">
              Pilih format file dan rentang tanggal untuk mengekspor sertifikat
              inspeksi yang disetujui.
            </p>
          </div>

          {/* Format Selection */}
          <div className="rounded-lg border border-gray-200 p-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Format Sertifikat
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="pdf"
                  checked={certificateFormat === "pdf"}
                  onChange={(e) =>
                    setCertificateFormat(e.target.value as "pdf" | "doc")
                  }
                  className="mr-2 h-4 w-4 border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm">
                  PDF (.pdf) - Format standar untuk sertifikat
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="doc"
                  checked={certificateFormat === "doc"}
                  onChange={(e) =>
                    setCertificateFormat(e.target.value as "pdf" | "doc")
                  }
                  className="mr-2 h-4 w-4 border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm">
                  Word (.doc) - Dapat diedit dan dimodifikasi
                </span>
              </label>
            </div>
          </div>

          {/* Date Filter */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={certificateDateFrom}
                  onChange={(e) => setCertificateDateFrom(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-amber-500"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={certificateDateTo}
                  onChange={(e) => setCertificateDateTo(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-amber-500"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Kosongkan untuk mengekspor semua sertifikat inspeksi yang
              disetujui
            </p>
          </div>

          {/* Preview Information */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-amber-900">Informasi Export</h4>
                <p className="mt-1 text-sm text-amber-700">
                  Hanya inspeksi dengan status <strong>"Disetujui"</strong> yang
                  akan dibuatkan sertifikat. Jika lebih dari 1 sertifikat
                  ditemukan, akan digabung menjadi satu file.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsCertificateModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={handleModalCertificateExport}
              disabled={exportLoading}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                certificateFormat === "pdf"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-50`}
            >
              {exportLoading
                ? "Generating..."
                : certificateFormat === "pdf"
                ? "Export PDF"
                : "Export Word"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
