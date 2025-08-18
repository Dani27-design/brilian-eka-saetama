"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  getDoc,
  DocumentReference,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
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
import { formatToWIB, formatDateOnlyWIB } from "@/utils/dateFormatter";
import {
  findProductLocation,
  ProductDetail,
} from "@/utils/findProductLocation";
import {
  exportToExcel,
  exportToCSV,
  exportToBoth,
  createFilteredExport,
  validateExportData,
  getExportStats,
} from "@/utils/exportInspection";
import {
  createCertificateData,
  printCertificate,
  validateCertificateData,
  getCertificateStats,
} from "@/utils/pdfCertificate";
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
  productType: ProductType;
  expirationDate: string;
  location: string;
  inspectionDate: string;
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

  // Photo modal
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Photo gallery modal
  const [photoGallery, setPhotoGallery] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);

  // Export modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<"excel" | "csv" | "certificate">(
    "excel",
  );

  // Export states
  const [exportLoading, setExportLoading] = useState(false);

  // Export date filter states
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");

  // Certificate generation states
  const [certificateLoading, setCertificateLoading] = useState<string | null>(
    null,
  );

  /**
   * Fetches all maintenances with inspections and related data
   * Processes contract, product, and engineer information for display
   */
  const fetchInspections = async () => {
    try {
      setLoading(true);
      setError("");

      // Query maintenances that have inspection data
      const maintenancesSnap = await getDocs(
        collection(firestore, "maintenances"),
      );
      const inspectionRows: InspectionTableRow[] = [];

      for (const maintenanceDoc of maintenancesSnap.docs) {
        const maintenanceData = maintenanceDoc.data() as Maintenance;

        // Skip maintenances without inspection data
        if (!maintenanceData.inspection) {
          continue;
        }

        try {
          // Fetch contract data
          let contractNumber = "N/A";
          let contractName = "N/A";
          let location = "N/A";
          let productDetails: ProductDetail[] = [];

          if (maintenanceData.contract) {
            const contractSnap = await getDoc(maintenanceData.contract);
            if (contractSnap.exists()) {
              const contractData = contractSnap.data();
              contractNumber = contractData.contractNumber || "N/A";
              contractName = contractData.contractName || "N/A";
              productDetails = contractData.productDetails || [];
            }
          }

          // Fetch product data
          let productNumber = "N/A";
          let productName = "N/A";
          let productBrand = "N/A";
          let expirationDate = "N/A";

          if (maintenanceData.product) {
            const productSnap = await getDoc(maintenanceData.product);
            if (productSnap.exists()) {
              const productData = productSnap.data();
              productNumber = productData.productNumber || "N/A";
              productName = productData.name || "N/A";
              productBrand = productData.specs?.brand || "N/A";

              // Get expiration date if available (mainly for APAR products)
              if (productData.specs?.expirationDate) {
                expirationDate = formatDateOnlyWIB(
                  productData.specs.expirationDate,
                );
              }

              // Find location for this product
              location = findProductLocation(
                maintenanceData.product,
                productDetails,
              );
            }
          }

          // Fetch engineer data
          const engineerNames: string[] = [];
          if (
            Array.isArray(maintenanceData.engineer) &&
            maintenanceData.engineer.length > 0
          ) {
            for (const engineerRef of maintenanceData.engineer) {
              try {
                const engineerSnap = await getDoc(engineerRef);
                if (engineerSnap.exists()) {
                  const engineerData = engineerSnap.data();
                  engineerNames.push(engineerData.name || engineerSnap.id);
                }
              } catch (engineerError) {
                console.warn("Failed to fetch engineer:", engineerError);
              }
            }
          }

          // Calculate checklist summary and store details
          const checklist = maintenanceData.inspection.checklist || [];
          const checklistSummary = {
            totalItems: checklist.length,
            okCount: checklist.filter((item: any) => item.status === true)
              .length,
            nokCount: checklist.filter((item: any) => item.status === false)
              .length,
          };
          const checklistDetails = checklist;

          // Determine inspection date
          const inspectionDate = formatToWIB(
            maintenanceData.inspection.createdAt,
          );

          // Create table row
          const inspectionRow: InspectionTableRow = {
            id: maintenanceDoc.id,
            contractNumber,
            contractName,
            productNumber,
            productName,
            productBrand,
            productType: maintenanceData.productType,
            expirationDate,
            location,
            inspectionDate,
            engineerNames,
            checklistSummary,
            checklistDetails, // Add checklist details
            photos: maintenanceData.inspection.photos || [],
            status: maintenanceData.status,
            hasInspection: true,
            canApprove: maintenanceData.status === "waiting_approval",
            maintenance: maintenanceData,
          };

          inspectionRows.push(inspectionRow);
        } catch (rowError) {
          console.error(
            `Error processing maintenance ${maintenanceDoc.id}:`,
            rowError,
          );
          // Continue with other rows
        }
      }

      // Sort by inspection date (newest first)
      inspectionRows.sort((a, b) => {
        const dateA = new Date(a.inspectionDate).getTime();
        const dateB = new Date(b.inspectionDate).getTime();
        return dateB - dateA;
      });

      setInspections(inspectionRows);
      setFilteredInspections(inspectionRows);
    } catch (error) {
      console.error("Error fetching inspections:", error);
      setError("Gagal memuat data inspeksi. Silakan coba lagi.");
    } finally {
      setLoading(false);
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
    fetchInspections();
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInspections = filteredInspections.slice(startIndex, endIndex);

  // Photo modal handlers
  const openPhotoModal = (photoUrl: string) => {
    setSelectedPhoto(photoUrl);
    setIsPhotoModalOpen(true);
  };

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
   * Validates data before export and shows appropriate error messages
   */
  const handleExportExcel = async () => {
    setExportLoading(true);
    setError("");

    try {
      // Apply date filter to export data
      let dataToExport = filteredInspections;

      if (exportDateFrom || exportDateTo) {
        dataToExport = filteredInspections.filter((inspection) => {
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

      // Create filtered export data
      const exportData = createFilteredExport(dataToExport);

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

      await exportToExcel(exportData, filename);
    } catch (error: any) {
      console.error("Export Excel error:", error);
      setError(error.message || "Gagal mengekspor data ke Excel");
    } finally {
      setExportLoading(false);
    }
  };

  /**
   * Handles exporting inspection data to CSV format
   * Validates data before export and shows appropriate error messages
   */
  const handleExportCSV = async () => {
    setExportLoading(true);
    setError("");

    try {
      // Apply date filter to export data
      let dataToExport = filteredInspections;

      if (exportDateFrom || exportDateTo) {
        dataToExport = filteredInspections.filter((inspection) => {
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

      // Create filtered export data
      const exportData = createFilteredExport(dataToExport);

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

      await exportToCSV(exportData, filename);
    } catch (error: any) {
      console.error("Export CSV error:", error);
      setError(error.message || "Gagal mengekspor data ke CSV");
    } finally {
      setExportLoading(false);
    }
  };

  /**
   * Handles export from modal based on selected export type
   */
  const handleModalExport = async () => {
    setIsExportModalOpen(false);

    switch (exportType) {
      case "excel":
        await handleExportExcel();
        break;
      case "csv":
        await handleExportCSV();
        break;
      case "certificate":
        await handleBulkCertificateDownload();
        break;
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

      // Generate and download PDF
      printCertificate(certificateData, filename);
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

          // Generate and download certificate (with delay to prevent browser blocking)
          await new Promise((resolve) => setTimeout(resolve, 1000 * i)); // 1 second delay between downloads
          printCertificate(certificateData, filename);
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
                onClick={() => {
                  setExportType("excel");
                  setIsExportModalOpen(true);
                }}
                disabled={exportLoading}
                className="inline-flex items-center rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                title="Export ke Excel (.xlsx)"
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
                {exportLoading ? "Exporting..." : "Excel"}
              </button>

              <button
                onClick={() => {
                  setExportType("csv");
                  setIsExportModalOpen(true);
                }}
                disabled={exportLoading}
                className="inline-flex items-center rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                title="Export ke CSV (.csv)"
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
                {exportLoading ? "Exporting..." : "CSV"}
              </button>

              <button
                onClick={() => {
                  setExportType("certificate");
                  setIsExportModalOpen(true);
                }}
                disabled={exportLoading}
                className="inline-flex items-center rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                title="Download bulk certificates"
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
                {exportLoading ? "Generating..." : "Sertifikat Inspeksi"}
              </button>
            </>
          )}

          <button
            onClick={fetchInspections}
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
            Menampilkan {currentInspections.length} dari{" "}
            {filteredInspections.length} inspeksi
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
                  {currentInspections.map((inspection) => (
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
            {totalPages > 1 && (
              <div className="mt-4 flex flex-col items-center justify-between space-y-3 border-t pt-4 sm:flex-row sm:space-y-0">
                <div className="text-xs text-gray-600">
                  Menampilkan {startIndex + 1}-
                  {Math.min(endIndex, filteredInspections.length)} dari{" "}
                  {filteredInspections.length} inspeksi
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Item per halaman:
                  </span>
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
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
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
                    Halaman <span className="font-medium">{currentPage}</span>{" "}
                    dari {totalPages}
                  </span>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
                      currentPage === totalPages
                        ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                        : "border-stroke bg-white hover:bg-gray-100"
                    }`}
                  >
                    &gt;
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
        title={`Export ${
          exportType === "excel"
            ? "Excel"
            : exportType === "csv"
            ? "CSV"
            : "Sertifikat"
        }`}
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">
              {exportType === "certificate"
                ? "Pilih rentang tanggal untuk mengunduh sertifikat inspeksi yang sudah disetujui"
                : "Pilih rentang tanggal untuk memfilter data yang akan diekspor"}
            </p>
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

          {/* Summary Info */}
          {(exportDateFrom || exportDateTo || exportType === "certificate") && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p className="font-medium text-gray-700">Informasi Export:</p>
              {(exportDateFrom || exportDateTo) && (
                <p className="text-blue-600">
                  Data akan difilter berdasarkan rentang tanggal yang dipilih
                </p>
              )}
              {exportType === "certificate" && (
                <p className="text-blue-600">
                  Hanya inspeksi yang sudah disetujui yang akan dibuatkan
                  sertifikat
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
                exportType === "excel"
                  ? "bg-green-600 hover:bg-green-700"
                  : exportType === "csv"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-amber-600 hover:bg-amber-700"
              } disabled:opacity-50`}
            >
              {exportLoading
                ? "Processing..."
                : exportType === "excel"
                ? "Export Excel"
                : exportType === "csv"
                ? "Export CSV"
                : "Download Sertifikat"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
