import * as XLSX from "xlsx";
import Papa from "papaparse";
import { ProductType } from "@/types/product";
import { formatDateOnlyWIB } from "./dateFormatter";

/**
 * Represents a flattened inspection row for export with new Indonesian format
 * Uses proper Indonesian column headers and restructured data
 */
export interface InspectionExportRow {
  // Core Required Columns (Indonesian headers)
  "No. Kontrak": string; // contracts.contractNumber
  "Nama Kontrak": string; // contracts.contractName
  "No. Produk": string; // products.productNumber
  "Merk Produk": string; // products.specs.brand
  "Jenis Produk": string; // products.specs.brandType
  "Kapasitas Produk": string; // products.specs.capacity
  "Tgl Expired": string; // products.specs.expirationDate
  Lokasi: string; // contracts.productDetails[x].location
  "Pelaksanaan Inspeksi": string; // maintenances.inspection.createdAt
  "Petugas Inspeksi": string; // users.name (from inspection.createdBy)

  // Dynamic Columns (checklist items and photos)
  [key: string]: string; // For checklist items and "Foto [n]" columns
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
export function transformInspectionData(
  inspections: any[],
): InspectionExportRow[] {
  return inspections.map((inspection, rowIndex) => {
    const baseRow: InspectionExportRow = {
      // 10 core columns (header dalam bahasa Indonesia)
      "No. Kontrak": inspection.contractNumber ?? "N/A",
      "Nama Kontrak": inspection.contractName ?? "N/A",
      "No. Produk": inspection.productNumber ?? "N/A",
      "Merk Produk": inspection.productBrand ?? "N/A",
      "Jenis Produk": inspection.brandType ?? "N/A",
      "Kapasitas Produk": inspection.capacity ?? "N/A",
      "Tgl Expired": inspection.expirationDate ?? "N/A",
      Lokasi: inspection.location ?? "N/A",
      "Pelaksanaan Inspeksi": inspection.inspectionDate ?? "N/A",
      "Petugas Inspeksi": inspection.inspectorName ?? "N/A",
    };

    // checklist items (dynamic)
    const checklistItems: string[] = [];
    if (
      inspection.checklistDetails &&
      Array.isArray(inspection.checklistDetails)
    ) {
      inspection.checklistDetails.forEach((item: any) => {
        const columnName = item.item ?? "Unknown Item";
        checklistItems.push(columnName);
        baseRow[columnName] =
          item.status === true ? "BAIK" : item.remarks ?? "NOK";
      });
    } else if (inspection.maintenance?.inspection?.checklist) {
      inspection.maintenance.inspection.checklist.forEach((item: any) => {
        const columnName = item.item ?? "Unknown Item";
        checklistItems.push(columnName);
        baseRow[columnName] =
          item.status === true ? "BAIK" : item.remarks ?? "NOK";
      });
    }

    // photos
    const photos: string[] =
      Array.isArray(inspection.photos) && inspection.photos.length > 0
        ? inspection.photos
        : Array.isArray(inspection.maintenance?.inspection?.photos)
        ? inspection.maintenance!.inspection!.photos
        : [];

    photos.forEach((photoUrl: string, index: number) => {
      const linkColumnName = `Link Foto ${index + 1}`; // will contain raw URL
      const photoColumnName = `Foto ${index + 1}`; // will contain formula referencing the URL column

      baseRow[linkColumnName] = photoUrl;
      // Put a placeholder string (we'll convert to real formula object after sheet creation)
      // set to empty string to avoid accidental Excel interpretation
      baseRow[photoColumnName] = ""; // placeholder for IMAGE formula
    });

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
  filename: string = `inspection_export_${
    new Date().toISOString().split("T")[0]
  }`,
): Promise<void> {
  try {
    if (!Array.isArray(inspections)) {
      throw new Error("Invalid inspections data: must be an array");
    }
    if (inspections.length === 0) {
      throw new Error("Tidak ada data inspeksi untuk diekspor");
    }

    // Transform data
    const exportData = transformInspectionData(inspections);
    if (exportData.length === 0) {
      throw new Error(
        "Tidak ada data inspeksi untuk diekspor setelah transformasi",
      );
    }

    // Build workbook & worksheet from JSON (keuntungan: json_to_sheet pakai object insertion order untuk header)
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData, {
      skipHeader: false,
    });

    // Prepare column widths (you can tune these)
    // We'll build !cols berdasarkan header order
    const headerKeys = Object.keys(exportData[0]);
    const cols = headerKeys.map((key) => {
      if (key.startsWith("Link Foto ")) return { wch: 50 }; // Wide for URL columns
      if (key.startsWith("Foto ")) return { wch: 30 }; // For IMAGE formula columns
      return { wch: 20 }; // Default width for other columns
    });
    worksheet["!cols"] = cols;

    // --- POST-PROCESS: convert placeholder formula cells into real formula objects,
    // and ensure the formula references the correct URL cell address ---
    //
    // headerKeys: array of headers in the exact order json_to_sheet used.
    // For each row (data index r -> sheet row r+2), find any header that matches "Foto N"
    // then find column index of "Link Foto N" and set formula cell at (formulaCol, row) to { f: `IMAGE(A2)` }.

    // Helper: iterate rows
    for (let r = 0; r < exportData.length; r++) {
      const sheetRowIndex = r + 1; // 0-based row in encode_cell (0 is header), so data start at r+1
      for (let c = 0; c < headerKeys.length; c++) {
        const header = headerKeys[c];
        // detect formula-target headers like "Foto 1" (which will contain the IMAGE formula)
        const match = header.match(/^Foto\s+(\d+)$/i);
        if (!match) continue;
        const photoNumber = match[1];
        const urlHeader = `Link Foto ${photoNumber}`; // Find the corresponding URL column

        // column indexes
        const formulaColIndex = headerKeys.indexOf(header); // c
        const urlColIndex = headerKeys.indexOf(urlHeader);

        if (urlColIndex === -1) {
          // URL column not found; skip
          continue;
        }

        // addresses
        const formulaCellAddress = XLSX.utils.encode_cell({
          c: formulaColIndex,
          r: sheetRowIndex,
        });
        const urlCellAddressA1 = XLSX.utils.encode_cell({
          c: urlColIndex,
          r: sheetRowIndex,
        });

        // read URL value (should be present in worksheet already)
        const urlCellObj = worksheet[urlCellAddressA1];
        const urlValue = urlCellObj ? urlCellObj.v ?? "" : "";

        // Build formula referencing the URL cell (no quotes so IMAGE(A2) expects the URL cell content)
        // If the URL cell is empty we still write IMAGE("") (it will show empty)
        const formulaText = `IMAGE(${urlCellAddressA1})`;

        // Overwrite whatever is at formula cell with proper formula object
        // We set .f to formulaText (without leading '=' because SheetJS expects f without '=')
        // But SheetJS accepts { f: 'IMAGE(A2)' } — when writing XLSX it will add '=' automatically.
        worksheet[formulaCellAddress] = { f: formulaText };

        // Optionally we can set cached value (v) empty or the image URL itself.
        // For compatibility, we won't set a cached value; Excel/Sheets will evaluate.
      }
    }

    // Ensure range is correct
    if (!worksheet["!ref"]) {
      worksheet["!ref"] = XLSX.utils.encode_range({
        s: { c: 0, r: 0 },
        e: { c: headerKeys.length - 1, r: exportData.length },
      });
    }

    // Add workbook sheets
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inspection Data");

    // Write workbook -> array buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    downloadBlob(blob, `${filename}.xlsx`);
  } catch (err) {
    console.error("Error exporting to Excel:", err);
    throw err;
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
  filename: string = `inspection_export_${
    new Date().toISOString().split("T")[0]
  }`,
): Promise<void> {
  try {
    console.log(`📊 Starting CSV export for ${inspections.length} inspections`);

    // Validate input
    if (!Array.isArray(inspections)) {
      throw new Error("Invalid inspections data: must be an array");
    }

    if (inspections.length === 0) {
      throw new Error("Tidak ada data inspeksi untuk diekspor");
    }

    // Transform data for export
    console.log(`🔄 Transforming ${inspections.length} inspection records...`);
    const exportData = transformInspectionData(inspections);
    console.log(
      `✅ Transformed data: ${exportData.length} rows ready for export`,
    );

    if (exportData.length === 0) {
      throw new Error(
        "Tidak ada data inspeksi untuk diekspor setelah transformasi",
      );
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
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
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
  baseFilename: string = `inspection_export_${
    new Date().toISOString().split("T")[0]
  }`,
): Promise<void> {
  try {
    // Run both exports in parallel
    await Promise.all([
      exportToExcel(inspections, baseFilename),
      exportToCSV(inspections, baseFilename),
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
  } = {},
): any[] {
  let filtered = [...inspections];

  // Filter by product types
  if (filters.productTypes && filters.productTypes.length > 0) {
    filtered = filtered.filter((inspection) =>
      filters.productTypes!.includes(inspection.productType),
    );
  }

  // Filter by status
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter((inspection) =>
      filters.status!.includes(inspection.status),
    );
  }

  // Filter by date range
  if (filters.dateRange) {
    const startDate = new Date(filters.dateRange.start);
    const endDate = new Date(filters.dateRange.end);

    filtered = filtered.filter((inspection) => {
      const inspectionDate = new Date(inspection.inspectionDate);
      return inspectionDate >= startDate && inspectionDate <= endDate;
    });
  }

  // Filter by contracts
  if (filters.contracts && filters.contracts.length > 0) {
    filtered = filtered.filter((inspection) =>
      filters.contracts!.includes(inspection.contractNumber),
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

  return Object.keys(transformedData[0]).map((key) => {
    // Convert camelCase to readable format
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/item_(\d+)_(\w+)/i, (_, num, type) => {
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
  const requiredFields = ["contractNumber", "productNumber", "inspectionDate"];
  const missingFields = new Set<string>();

  inspections.forEach((inspection, index) => {
    requiredFields.forEach((field) => {
      if (!inspection[field]) {
        missingFields.add(field);
      }
    });

    // Check for empty checklist
    if (
      !inspection.checklistSummary ||
      inspection.checklistSummary.totalItems === 0
    ) {
      warnings.push(`Inspeksi ${index + 1} tidak memiliki data checklist`);
    }

    // Check for missing photos
    if (!inspection.photos || inspection.photos.length === 0) {
      warnings.push(`Inspeksi ${index + 1} tidak memiliki foto`);
    }
  });

  if (missingFields.size > 0) {
    errors.push(`Field wajib hilang: ${Array.from(missingFields).join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Helper function to download blob as file
 * Creates temporary download link and triggers download with enhanced error handling
 *
 * @param blob - The blob to download
 * @param filename - Name of the file to download
 */
function downloadBlob(blob: Blob, filename: string): void {
  try {
    console.log(`📥 Starting download of ${filename} (${blob.size} bytes)`);

    // Check if blob is valid
    if (!blob || blob.size === 0) {
      throw new Error("Invalid or empty blob data");
    }

    // Create object URL
    const url = window.URL.createObjectURL(blob);
    console.log(`🔗 Created blob URL: ${url}`);

    // Create download link
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";

    // Add to DOM and trigger click
    document.body.appendChild(link);
    console.log(`⬇️ Triggering download for ${filename}`);

    // Use a timeout to ensure the link is properly added to DOM
    setTimeout(() => {
      try {
        link.click();
        console.log(`✅ Download initiated successfully for ${filename}`);
      } catch (clickError) {
        console.error(`❌ Error clicking download link:`, clickError);

        // Fallback: try direct blob download
        try {
          const dataUrl = URL.createObjectURL(blob);
          const fallbackLink = document.createElement("a");
          fallbackLink.href = dataUrl;
          fallbackLink.download = filename;
          fallbackLink.click();
          console.log(`✅ Fallback download successful for ${filename}`);
        } catch (fallbackError) {
          console.error(`❌ Fallback download failed:`, fallbackError);
          throw new Error("Unable to trigger download");
        }
      } finally {
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    }, 100);
  } catch (error) {
    console.error(`❌ Download failed for ${filename}:`, error);
    throw new Error(
      `Gagal mengunduh file ${filename}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
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
    contractCount: new Set(inspections.map((i) => i.contractNumber)).size,
    productTypeBreakdown: {} as Record<ProductType, number>,
    statusBreakdown: {} as Record<string, number>,
    dateRange: { earliest: "", latest: "" },
  };

  if (inspections.length === 0) {
    return stats;
  }

  // Count product types
  inspections.forEach((inspection) => {
    const productType = inspection.productType;
    stats.productTypeBreakdown[productType] =
      (stats.productTypeBreakdown[productType] || 0) + 1;

    const status = inspection.status;
    stats.statusBreakdown[status] = (stats.statusBreakdown[status] || 0) + 1;
  });

  // Find date range
  const dates = inspections
    .map((i) => new Date(i.inspectionDate))
    .filter((date) => !isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length > 0) {
    stats.dateRange.earliest = formatDateOnlyWIB(dates[0]);
    stats.dateRange.latest = formatDateOnlyWIB(dates[dates.length - 1]);
  }

  return stats;
}
