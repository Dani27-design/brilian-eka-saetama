import * as XLSX from "xlsx";
import Papa from "papaparse";
import { Maintenance, InspectionChecklist } from "@/types/maintenances";
import { ProductType } from "@/types/product";
import { formatToWIB, formatDateOnlyWIB } from "./dateFormatter";

/**
 * Represents a flattened inspection row for export
 * Mirrors the inspection table display with additional details
 */
export interface InspectionExportRow {
  // Contract Information
  contractNumber: string;
  contractName: string;
  
  // Product Information
  productNumber: string;
  productName: string;
  productBrand: string;
  productType: ProductType;
  expirationDate: string;
  location: string;
  
  // Inspection Information
  inspectionDate: string;
  engineerNames: string;
  status: string;
  
  // Checklist Summary
  totalChecklistItems: number;
  okCount: number;
  nokCount: number;
  
  // Photos
  photoCount: number;
  photoUrls: string;
  
  // Individual Checklist Items (dynamic columns)
  [key: string]: string | number; // For checklist items like "item_1_status", "item_1_remarks"
}

/**
 * Transforms inspection data for export
 * Flattens complex nested data into exportable format
 * 
 * @param inspections - Array of inspection data from the listing page
 * @returns Array of flattened export rows
 * 
 * @example
 * const inspectionData = [
 *   {
 *     contractNumber: "CTR-001",
 *     productName: "Fire Extinguisher",
 *     checklistSummary: { totalItems: 5, okCount: 4, nokCount: 1 },
 *     // ... other data
 *   }
 * ];
 * 
 * const exportData = transformInspectionData(inspectionData);
 * // Returns flattened data with individual checklist columns
 */
export function transformInspectionData(inspections: any[]): InspectionExportRow[] {
  return inspections.map((inspection, index) => {
    const baseRow: InspectionExportRow = {
      // Contract Information
      contractNumber: inspection.contractNumber || "N/A",
      contractName: inspection.contractName || "N/A",
      
      // Product Information
      productNumber: inspection.productNumber || "N/A",
      productName: inspection.productName || "N/A",
      productBrand: inspection.productBrand || "N/A",
      productType: inspection.productType || "N/A",
      expirationDate: inspection.expirationDate || "N/A",
      location: inspection.location || "N/A",
      
      // Inspection Information
      inspectionDate: inspection.inspectionDate || "N/A",
      engineerNames: Array.isArray(inspection.engineerNames) 
        ? inspection.engineerNames.join(", ") 
        : inspection.engineerNames || "N/A",
      status: inspection.status || "N/A",
      
      // Checklist Summary
      totalChecklistItems: inspection.checklistSummary?.totalItems || 0,
      okCount: inspection.checklistSummary?.okCount || 0,
      nokCount: inspection.checklistSummary?.nokCount || 0,
      
      // Photos
      photoCount: inspection.photos?.length || 0,
      photoUrls: Array.isArray(inspection.photos) 
        ? inspection.photos.join("; ") 
        : "",
    };

    // Add individual checklist items as separate columns
    if (inspection.maintenance?.inspection?.checklist) {
      const checklist = inspection.maintenance.inspection.checklist;
      checklist.forEach((item: any, itemIndex: number) => {
        const itemNum = itemIndex + 1;
        baseRow[`item_${itemNum}_name`] = item.item || `Item ${itemNum}`;
        baseRow[`item_${itemNum}_status`] = item.status ? "OK" : "NOK";
        baseRow[`item_${itemNum}_remarks`] = item.remarks || "";
      });
    }

    return baseRow;
  });
}

/**
 * Exports inspection data to Excel format
 * Creates downloadable XLSX file with formatted data
 * 
 * @param inspections - Array of inspection data
 * @param filename - Optional filename (without extension)
 * @returns Promise that resolves when download is complete
 * 
 * @example
 * await exportToExcel(inspectionData, "inspection_report_2025");
 * // Downloads file named "inspection_report_2025.xlsx"
 */
export async function exportToExcel(
  inspections: any[], 
  filename: string = `inspection_export_${new Date().toISOString().split('T')[0]}`
): Promise<void> {
  try {
    // Transform data for export
    const exportData = transformInspectionData(inspections);
    
    if (exportData.length === 0) {
      throw new Error("Tidak ada data inspeksi untuk diekspor");
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // contractNumber
      { wch: 25 }, // contractName
      { wch: 15 }, // productNumber
      { wch: 25 }, // productName
      { wch: 15 }, // productBrand
      { wch: 12 }, // productType
      { wch: 12 }, // expirationDate
      { wch: 20 }, // location
      { wch: 18 }, // inspectionDate
      { wch: 20 }, // engineerNames
      { wch: 12 }, // status
      { wch: 8 },  // totalChecklistItems
      { wch: 8 },  // okCount
      { wch: 8 },  // nokCount
      { wch: 8 },  // photoCount
      { wch: 50 }, // photoUrls
    ];

    // Add column widths for checklist items (dynamic)
    const maxItems = Math.max(...exportData.map(row => row.totalChecklistItems));
    for (let i = 1; i <= maxItems; i++) {
      columnWidths.push(
        { wch: 25 }, // item name
        { wch: 8 },  // status
        { wch: 30 }  // remarks
      );
    }

    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inspection Data");

    // Create metadata sheet
    const metadata = [
      { Field: "Export Date", Value: formatToWIB(new Date()) },
      { Field: "Total Records", Value: exportData.length },
      { Field: "Export Type", Value: "Inspection Data" },
      { Field: "Generated By", Value: "PT Brilian Eka Saetama - Inspection System" },
    ];
    
    const metaSheet = XLSX.utils.json_to_sheet(metadata);
    metaSheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, metaSheet, "Metadata");

    // Generate and download file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    downloadBlob(blob, `${filename}.xlsx`);

  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw new Error("Gagal mengekspor data ke Excel");
  }
}

/**
 * Exports inspection data to CSV format
 * Creates downloadable CSV file with comma-separated values
 * 
 * @param inspections - Array of inspection data
 * @param filename - Optional filename (without extension)
 * @returns Promise that resolves when download is complete
 * 
 * @example
 * await exportToCSV(inspectionData, "inspection_data");
 * // Downloads file named "inspection_data.csv"
 */
export async function exportToCSV(
  inspections: any[], 
  filename: string = `inspection_export_${new Date().toISOString().split('T')[0]}`
): Promise<void> {
  try {
    // Transform data for export
    const exportData = transformInspectionData(inspections);
    
    if (exportData.length === 0) {
      throw new Error("Tidak ada data inspeksi untuk diekspor");
    }

    // Convert to CSV using Papa Parse
    const csv = Papa.unparse(exportData, {
      header: true,
      delimiter: ",",
      quoteChar: '"',
      escapeChar: '"',
      newline: "\r\n",
    });

    // Create and download blob
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${filename}.csv`);

  } catch (error) {
    console.error("Error exporting to CSV:", error);
    throw new Error("Gagal mengekspor data ke CSV");
  }
}

/**
 * Exports inspection data to both Excel and CSV formats
 * Creates two downloadable files simultaneously
 * 
 * @param inspections - Array of inspection data
 * @param baseFilename - Base filename (without extension)
 * @returns Promise that resolves when both downloads are complete
 * 
 * @example
 * await exportToBoth(inspectionData, "monthly_inspection_report");
 * // Downloads both "monthly_inspection_report.xlsx" and "monthly_inspection_report.csv"
 */
export async function exportToBoth(
  inspections: any[], 
  baseFilename: string = `inspection_export_${new Date().toISOString().split('T')[0]}`
): Promise<void> {
  try {
    // Run both exports in parallel
    await Promise.all([
      exportToExcel(inspections, baseFilename),
      exportToCSV(inspections, baseFilename)
    ]);
  } catch (error) {
    console.error("Error exporting to both formats:", error);
    throw new Error("Gagal mengekspor data ke Excel dan CSV");
  }
}

/**
 * Creates export data with filtered inspection information
 * Applies filters before export to reduce file size
 * 
 * @param inspections - Array of inspection data
 * @param filters - Export filter options
 * @returns Filtered inspection data ready for export
 * 
 * @example
 * const filtered = createFilteredExport(inspections, {
 *   productTypes: ["APAR", "HYDRANT"],
 *   status: ["approved"],
 *   dateRange: { start: "2025-01-01", end: "2025-12-31" }
 * });
 */
export function createFilteredExport(
  inspections: any[],
  filters: {
    productTypes?: ProductType[];
    status?: string[];
    dateRange?: { start: string; end: string };
    contracts?: string[];
  } = {}
): any[] {
  let filtered = [...inspections];

  // Filter by product types
  if (filters.productTypes && filters.productTypes.length > 0) {
    filtered = filtered.filter(inspection => 
      filters.productTypes!.includes(inspection.productType)
    );
  }

  // Filter by status
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter(inspection => 
      filters.status!.includes(inspection.status)
    );
  }

  // Filter by date range
  if (filters.dateRange) {
    const startDate = new Date(filters.dateRange.start);
    const endDate = new Date(filters.dateRange.end);
    
    filtered = filtered.filter(inspection => {
      const inspectionDate = new Date(inspection.inspectionDate);
      return inspectionDate >= startDate && inspectionDate <= endDate;
    });
  }

  // Filter by contracts
  if (filters.contracts && filters.contracts.length > 0) {
    filtered = filtered.filter(inspection => 
      filters.contracts!.includes(inspection.contractNumber)
    );
  }

  return filtered;
}

/**
 * Gets column headers for export data
 * Returns formatted column names for display
 * 
 * @param sampleData - Sample inspection data to determine columns
 * @returns Array of formatted column headers
 */
export function getExportHeaders(sampleData: any[]): string[] {
  if (sampleData.length === 0) return [];

  const transformedData = transformInspectionData(sampleData);
  if (transformedData.length === 0) return [];

  return Object.keys(transformedData[0]).map(key => {
    // Convert camelCase to readable format
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/item_(\d+)_(\w+)/i, (match, num, type) => {
        return `Item ${num} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
      });
  });
}

/**
 * Validates export data before processing
 * Checks for required fields and data integrity
 * 
 * @param inspections - Array of inspection data to validate
 * @returns Validation result with success status and messages
 * 
 * @example
 * const validation = validateExportData(inspections);
 * if (!validation.isValid) {
 *   console.error("Validation errors:", validation.errors);
 * }
 */
export function validateExportData(inspections: any[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(inspections)) {
    errors.push("Data inspeksi harus berupa array");
    return { isValid: false, errors, warnings };
  }

  if (inspections.length === 0) {
    errors.push("Tidak ada data inspeksi untuk diekspor");
    return { isValid: false, errors, warnings };
  }

  // Check required fields
  const requiredFields = ['contractNumber', 'productNumber', 'inspectionDate'];
  const missingFields = new Set<string>();

  inspections.forEach((inspection, index) => {
    requiredFields.forEach(field => {
      if (!inspection[field]) {
        missingFields.add(field);
      }
    });

    // Check for empty checklist
    if (!inspection.checklistSummary || inspection.checklistSummary.totalItems === 0) {
      warnings.push(`Inspeksi ${index + 1} tidak memiliki data checklist`);
    }

    // Check for missing photos
    if (!inspection.photos || inspection.photos.length === 0) {
      warnings.push(`Inspeksi ${index + 1} tidak memiliki foto`);
    }
  });

  if (missingFields.size > 0) {
    errors.push(`Field wajib hilang: ${Array.from(missingFields).join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Helper function to download blob as file
 * Creates temporary download link and triggers download
 * 
 * @param blob - The blob to download
 * @param filename - Name of the file to download
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  window.URL.revokeObjectURL(url);
}

/**
 * Gets export summary statistics
 * Provides overview of data being exported
 * 
 * @param inspections - Array of inspection data
 * @returns Export statistics object
 * 
 * @example
 * const stats = getExportStats(inspections);
 * console.log(`Exporting ${stats.totalInspections} inspections from ${stats.contractCount} contracts`);
 */
export function getExportStats(inspections: any[]): {
  totalInspections: number;
  contractCount: number;
  productTypeBreakdown: Record<ProductType, number>;
  statusBreakdown: Record<string, number>;
  dateRange: { earliest: string; latest: string };
} {
  const stats = {
    totalInspections: inspections.length,
    contractCount: new Set(inspections.map(i => i.contractNumber)).size,
    productTypeBreakdown: {} as Record<ProductType, number>,
    statusBreakdown: {} as Record<string, number>,
    dateRange: { earliest: "", latest: "" }
  };

  if (inspections.length === 0) {
    return stats;
  }

  // Count product types
  inspections.forEach(inspection => {
    const productType = inspection.productType;
    stats.productTypeBreakdown[productType] = (stats.productTypeBreakdown[productType] || 0) + 1;
    
    const status = inspection.status;
    stats.statusBreakdown[status] = (stats.statusBreakdown[status] || 0) + 1;
  });

  // Find date range
  const dates = inspections
    .map(i => new Date(i.inspectionDate))
    .filter(date => !isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length > 0) {
    stats.dateRange.earliest = formatDateOnlyWIB(dates[0]);
    stats.dateRange.latest = formatDateOnlyWIB(dates[dates.length - 1]);
  }

  return stats;
}