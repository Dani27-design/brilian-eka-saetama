import * as XLSX from "xlsx";
import { ProductType } from "@/types/product";

// ─── APAR Export (flat table, multiple rows per file) ────────────────────────

/**
 * APAR checklist column names in export order.
 * "Exp Date" is excluded per spec — it stays as a core column (Tgl Expired).
 */
const APAR_CHECKLIST_COLUMNS = ["Hose", "Pressure", "Handle", "Body", "Safety Pin"];

/**
 * Builds an APAR flat-table worksheet from inspection rows.
 * Columns: core fields → checklist status → Foto N (=IMAGE) → Link Foto N (raw URL)
 */
function buildAparWorksheet(inspections: any[]): XLSX.WorkSheet {
  // Determine max photo count across all inspections (inspection-level photos)
  const maxPhotos = inspections.reduce((max, insp) => {
    const photos: string[] = insp.photos || insp.maintenance?.inspection?.photos || [];
    return Math.max(max, photos.length);
  }, 0);

  // Build header row
  const headers: string[] = [
    "No. Kontrak",
    "Nama Kontrak",
    "No. Produk",
    "Merk Produk",
    "Jenis Produk",
    "Kapasitas Produk",
    "Tgl Expired",
    "Lokasi",
    "Pelaksanaan Inspeksi",
    "Petugas Inspeksi",
    ...APAR_CHECKLIST_COLUMNS,
  ];

  // Photo columns: Foto 1..N then Link Foto 1..N
  for (let i = 1; i <= maxPhotos; i++) headers.push(`Foto ${i}`);
  for (let i = 1; i <= maxPhotos; i++) headers.push(`Link Foto ${i}`);

  // Build data rows
  const rows: (string | object)[][] = [];
  for (const insp of inspections) {
    const checklist: any[] = insp.checklistDetails || insp.maintenance?.inspection?.checklist || [];
    const photos: string[] = insp.photos || insp.maintenance?.inspection?.photos || [];

    const row: (string | object)[] = [
      insp.contractNumber ?? "N/A",
      insp.contractName ?? "N/A",
      insp.productNumber ?? "N/A",
      insp.productBrand ?? "N/A",
      insp.brandType ?? "N/A",
      insp.capacity ?? "N/A",
      insp.expirationDate ?? "N/A",
      insp.location ?? "N/A",
      insp.inspectionDate ?? "N/A",
      insp.engineerNames?.join(", ") || insp.inspectorName || "N/A",
    ];

    // Checklist status columns — "BAIK" if OK, remarks if not
    for (const colName of APAR_CHECKLIST_COLUMNS) {
      const item = checklist.find((c: any) => c.item === colName);
      if (!item) {
        row.push("-");
      } else if (item.status === true) {
        row.push("BAIK");
      } else {
        row.push(item.remarks || "NOK");
      }
    }

    // Foto N columns (=IMAGE formula placeholder — will be set after sheet creation)
    for (let i = 0; i < maxPhotos; i++) {
      row.push(i < photos.length ? "" : ""); // placeholder
    }

    // Link Foto N columns (raw URL)
    for (let i = 0; i < maxPhotos; i++) {
      row.push(i < photos.length ? photos[i] : "");
    }

    rows.push(row);
  }

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Post-process: inject IMAGE formulas for Foto N columns
  const fotoStartCol = headers.indexOf("Foto 1");
  const linkStartCol = headers.indexOf("Link Foto 1");
  if (fotoStartCol !== -1 && linkStartCol !== -1) {
    for (let r = 0; r < rows.length; r++) {
      const sheetRow = r + 1; // 0-based, row 0 is header
      for (let p = 0; p < maxPhotos; p++) {
        const fotoCell = XLSX.utils.encode_cell({ c: fotoStartCol + p, r: sheetRow });
        const linkCell = XLSX.utils.encode_cell({ c: linkStartCol + p, r: sheetRow });
        const linkValue = ws[linkCell]?.v ?? "";
        if (linkValue) {
          ws[fotoCell] = { f: `IMAGE("${linkValue}")` };
        }
      }
    }
  }

  // Column widths
  ws["!cols"] = headers.map((h) => {
    if (h.startsWith("Link Foto")) return { wch: 50 };
    if (h.startsWith("Foto")) return { wch: 30 };
    return { wch: 20 };
  });

  return ws;
}

/**
 * Exports APAR inspections to a single Excel file (flat table, multiple rows).
 */
export async function exportAparToExcel(
  inspections: any[],
  filename: string,
): Promise<void> {
  if (!inspections.length) throw new Error("Tidak ada data inspeksi APAR untuk diekspor");

  const ws = buildAparWorksheet(inspections);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inspeksi APAR");

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${filename}.xlsx`,
  );
}

// ─── Hydrant / Fire Alarm Export (vertical header, 1 file per inspection) ────

/**
 * Builds a vertical-header worksheet for a single Hydrant or Fire Alarm inspection.
 *
 * Layout:
 *   Row 1: Nama Produk        | [productName] - [productNumber]
 *   Row 2: No. Kontrak        | [contractNumber]
 *   Row 3: Nama Kontrak       | [contractName]
 *   Row 4: Petugas Inspeksi   | [engineerNames]
 *   Row 5: Tanggal Inspeksi   | [inspectionDate]
 *   Row 6: (empty)
 *   Row 7: No. | Uraian Pekerjaan | Foto Bukti Kegiatan 1 | ... | Link Bukti Kegiatan 1 | ...
 *   Row 8+: data rows
 */
function buildVerticalWorksheet(insp: any): XLSX.WorkSheet {
  const checklist: any[] = insp.checklistDetails || insp.maintenance?.inspection?.checklist || [];

  // Determine max per-item photo count
  const maxItemPhotos = checklist.reduce((max: number, item: any) => {
    const photos: string[] = item.photos || [];
    return Math.max(max, photos.length);
  }, 0);

  // --- Header rows (vertical key-value) ---
  const headerRows: (string | object)[][] = [
    ["Nama Produk", `${insp.productName ?? "N/A"} - ${insp.productNumber ?? "N/A"}`],
    ["No. Kontrak", insp.contractNumber ?? "N/A"],
    ["Nama Kontrak", insp.contractName ?? "N/A"],
    ["Petugas Inspeksi", insp.engineerNames?.join(", ") || insp.inspectorName || "N/A"],
    ["Tanggal Inspeksi", insp.inspectionDate ?? "N/A"],
    [], // empty separator row
  ];

  // --- Table header row ---
  const tableHeaders: string[] = ["No.", "Uraian Pekerjaan"];
  for (let i = 1; i <= maxItemPhotos; i++) tableHeaders.push(`Foto Bukti Kegiatan ${i}`);
  for (let i = 1; i <= maxItemPhotos; i++) tableHeaders.push(`Link Bukti Kegiatan ${i}`);
  tableHeaders.push("Keterangan");

  // --- Table data rows ---
  const tableRows: (string | number | object)[][] = [];
  checklist.forEach((item: any, idx: number) => {
    const photos: string[] = item.photos || [];
    const row: (string | number | object)[] = [
      idx + 1,
      item.detail || item.item || "N/A",
    ];

    // Foto Bukti Kegiatan N (placeholder for IMAGE formula)
    for (let i = 0; i < maxItemPhotos; i++) {
      row.push(""); // placeholder
    }

    // Link Bukti Kegiatan N (raw URL)
    for (let i = 0; i < maxItemPhotos; i++) {
      row.push(i < photos.length ? photos[i] : "");
    }

    // Keterangan: "BAIK" if OK, remarks if not
    if (item.status === true) {
      row.push("BAIK");
    } else {
      row.push(item.remarks || "NOK");
    }

    tableRows.push(row);
  });

  // Combine all rows
  const allRows = [...headerRows, tableHeaders, ...tableRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Post-process: inject IMAGE formulas for Foto Bukti Kegiatan columns
  const dataStartRow = headerRows.length + 1; // 0-based row after table header
  const fotoStartCol = 2; // column C (0=No., 1=Uraian, 2=first foto)
  const linkStartCol = 2 + maxItemPhotos; // after all foto columns

  for (let r = 0; r < tableRows.length; r++) {
    const sheetRow = dataStartRow + r;
    for (let p = 0; p < maxItemPhotos; p++) {
      const fotoCell = XLSX.utils.encode_cell({ c: fotoStartCol + p, r: sheetRow });
      const linkCell = XLSX.utils.encode_cell({ c: linkStartCol + p, r: sheetRow });
      const linkValue = ws[linkCell]?.v ?? "";
      if (linkValue) {
        ws[fotoCell] = { f: `IMAGE("${linkValue}")` };
      }
    }
  }

  // Column widths
  const totalCols = tableHeaders.length;
  const cols: XLSX.ColInfo[] = [];
  for (let c = 0; c < totalCols; c++) {
    const header = tableHeaders[c] || "";
    if (header === "No.") cols.push({ wch: 6 });
    else if (header === "Uraian Pekerjaan") cols.push({ wch: 50 });
    else if (header.startsWith("Link Bukti")) cols.push({ wch: 50 });
    else if (header.startsWith("Foto Bukti")) cols.push({ wch: 30 });
    else if (header === "Keterangan") cols.push({ wch: 25 });
    else cols.push({ wch: 20 });
  }
  ws["!cols"] = cols;

  // Bold header label cells (column A rows 1-5)
  for (let r = 0; r < 5; r++) {
    const cell = XLSX.utils.encode_cell({ c: 0, r });
    if (ws[cell]) {
      ws[cell].s = { font: { bold: true } };
    }
  }

  return ws;
}

/**
 * Exports a single Hydrant/Fire Alarm inspection to Excel.
 * Returns the blob + filename so the caller can trigger multiple downloads.
 */
function buildSingleInspectionExcel(
  insp: any,
  productTypeLabel: string,
): { blob: Blob; filename: string } {
  const ws = buildVerticalWorksheet(insp);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Inspeksi ${productTypeLabel}`);

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Build filename: {type}_inspection_{contract}_{product}_{date}.xlsx
  const safeContract = sanitizeFilename(insp.contractNumber || "unknown");
  const safeProduct = sanitizeFilename(insp.productNumber || "unknown");
  const safeDate = sanitizeFilename(insp.inspectionDate || new Date().toISOString().split("T")[0]);

  const filename = `${productTypeLabel.toLowerCase()}_inspection_${safeContract}_${safeProduct}_${safeDate}.xlsx`;

  return { blob, filename };
}

/**
 * Exports Hydrant or Fire Alarm inspections — one file per inspection.
 * Downloads each file sequentially with a small delay to avoid browser blocking.
 */
export async function exportVerticalInspections(
  inspections: any[],
  productType: ProductType,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  if (!inspections.length) throw new Error("Tidak ada data inspeksi untuk diekspor");

  const label = productType === "HYDRANT" ? "Hydrant" : "Fire_Alarm";

  for (let i = 0; i < inspections.length; i++) {
    if (onProgress) onProgress(i + 1, inspections.length);

    const { blob, filename } = buildSingleInspectionExcel(inspections[i], label);
    downloadBlob(blob, filename);

    // Small delay between downloads to avoid browser popup blockers
    if (i < inspections.length - 1) {
      await delay(300);
    }
  }
}

// ─── Unified export entry point ──────────────────────────────────────────────

/**
 * Main export function — dispatches to APAR or Vertical format based on productType.
 */
export async function exportInspections(
  inspections: any[],
  productType: ProductType,
  filename: string,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  if (productType === "APAR") {
    await exportAparToExcel(inspections, filename);
  } else if (productType === "HYDRANT" || productType === "FIRE_ALARM") {
    await exportVerticalInspections(inspections, productType, onProgress);
  } else {
    // Fallback: use APAR flat format for other types
    await exportAparToExcel(inspections, filename);
  }
}

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Validates export data before processing.
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

  const requiredFields = ["contractNumber", "productNumber", "inspectionDate"];
  const missingFields = new Set<string>();

  inspections.forEach((inspection, index) => {
    requiredFields.forEach((field) => {
      if (!inspection[field]) missingFields.add(field);
    });

    if (!inspection.checklistDetails?.length && !inspection.maintenance?.inspection?.checklist?.length) {
      warnings.push(`Inspeksi ${index + 1} tidak memiliki data checklist`);
    }
  });

  if (missingFields.size > 0) {
    errors.push(`Field wajib hilang: ${Array.from(missingFields).join(", ")}`);
  }

  return { isValid: errors.length === 0, errors, warnings };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sanitizeFilename(str: string): string {
  return str.replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_").substring(0, 50);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function downloadBlob(blob: Blob, filename: string): void {
  if (!blob || blob.size === 0) {
    throw new Error("Invalid or empty blob data");
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);

  setTimeout(() => {
    try {
      link.click();
    } finally {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  }, 100);
}
