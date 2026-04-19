import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { ProductType } from "@/types/product";

export interface PDFExportOptions {
  showLogo?: boolean;
  customTitle?: string;
}

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

  // Build header row (aligned with PDF format)
  const headers: string[] = [
    "No. Produk",
    "Merk APAR",
    "Jenis APAR",
    "Berat (KG)",
    "Tgl Expired",
    ...APAR_CHECKLIST_COLUMNS,
    "Lokasi",
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
      insp.productNumber ?? "N/A",
      insp.productBrand ?? "N/A",
      insp.brandType ?? "N/A",
      insp.capacity ?? "N/A",
      insp.expirationDate ?? "N/A",
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

    // Lokasi column (after checklist, before photos)
    row.push(insp.location ?? "N/A");

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

  // No header info rows — aligned with PDF format (info is in letterhead/filename)
  const headerRows: (string | object)[][] = [];

  // --- Table header row ---
  const tableHeaders: string[] = ["No.", "Uraian Kegiatan"];
  for (let i = 1; i <= maxItemPhotos; i++) tableHeaders.push(`Foto Bukti Kegiatan ${i}`);
  for (let i = 1; i <= maxItemPhotos; i++) tableHeaders.push(`Link Bukti Kegiatan ${i}`);

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
    else cols.push({ wch: 20 });
  }
  ws["!cols"] = cols;

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

  const dateStr = getCleanDate(insp);
  const filename = buildStandardFilename(productTypeLabel, insp.contractNumber, "xlsx", dateStr, insp.productNumber);

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
  const sorted = [...inspections].sort((a, b) => {
    const numA = parseInt(String(a.productNumber ?? "0"), 10);
    const numB = parseInt(String(b.productNumber ?? "0"), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return String(a.productNumber ?? "").localeCompare(String(b.productNumber ?? ""));
  });
  if (productType === "APAR") {
    await exportAparToExcel(sorted, filename);
  } else if (productType === "HYDRANT" || productType === "FIRE_ALARM") {
    await exportVerticalInspections(sorted, productType, onProgress);
  } else {
    await exportAparToExcel(sorted, filename);
  }
}

// ─── CSV Export ─────────────────────────────────────────────────────────────

/**
 * Exports APAR inspections to CSV (flat table, same columns as Excel).
 */
export async function exportAparToCSV(
  inspections: any[],
  filename: string,
): Promise<void> {
  if (!inspections.length) throw new Error("Tidak ada data inspeksi APAR untuk diekspor");

  // Same headers as Excel (excluding IMAGE formula columns — only include Link Foto)
  const maxPhotos = inspections.reduce((max, insp) => {
    const photos: string[] = insp.photos || insp.maintenance?.inspection?.photos || [];
    return Math.max(max, photos.length);
  }, 0);

  // Headers aligned with PDF format
  const headers: string[] = [
    "No. Produk", "Merk APAR", "Jenis APAR", "Berat (KG)", "Tgl Expired",
    ...APAR_CHECKLIST_COLUMNS,
    "Lokasi",
  ];
  for (let i = 1; i <= maxPhotos; i++) headers.push(`Link Foto ${i}`);

  const rows: string[][] = [];
  for (const insp of inspections) {
    const checklist: any[] = insp.checklistDetails || insp.maintenance?.inspection?.checklist || [];
    const photos: string[] = insp.photos || insp.maintenance?.inspection?.photos || [];

    const row: string[] = [
      insp.productNumber ?? "N/A",
      insp.productBrand ?? "N/A",
      insp.brandType ?? "N/A",
      insp.capacity ?? "N/A",
      insp.expirationDate ?? "N/A",
    ];

    for (const colName of APAR_CHECKLIST_COLUMNS) {
      const item = checklist.find((c: any) => c.item === colName);
      if (!item) row.push("-");
      else if (item.status === true) row.push("BAIK");
      else row.push(item.remarks || "NOK");
    }

    row.push(insp.location ?? "N/A");

    for (let i = 0; i < maxPhotos; i++) {
      row.push(i < photos.length ? photos[i] : "");
    }

    rows.push(row);
  }

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Exports a single vertical-format inspection to CSV.
 */
function buildSingleInspectionCSV(insp: any, productTypeLabel: string): { content: string; filename: string } {
  const checklist: any[] = insp.checklistDetails || insp.maintenance?.inspection?.checklist || [];

  // No header info rows — aligned with PDF format
  const headerLines: string[] = [];

  // Table
  const maxItemPhotos = checklist.reduce((max: number, item: any) => Math.max(max, (item.photos || []).length), 0);
  const tableHeaders = ["No.", "Uraian Kegiatan"];
  for (let i = 1; i <= maxItemPhotos; i++) tableHeaders.push(`Link Bukti Kegiatan ${i}`);

  const tableRows: string[][] = [];
  checklist.forEach((item: any, idx: number) => {
    const photos: string[] = item.photos || [];
    const row: string[] = [
      String(idx + 1),
      item.detail || item.item || "N/A",
    ];
    for (let i = 0; i < maxItemPhotos; i++) {
      row.push(i < photos.length ? photos[i] : "");
    }
    tableRows.push(row);
  });

  const csvContent = [
    ...headerLines,
    tableHeaders.map(h => `"${h}"`).join(","),
    ...tableRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const dateStr = getCleanDate(insp);
  const filename = buildStandardFilename(productTypeLabel, insp.contractNumber, "csv", dateStr, insp.productNumber);

  return { content: csvContent, filename };
}

/**
 * Exports vertical inspections to CSV — one file per inspection.
 */
export async function exportVerticalInspectionsCSV(
  inspections: any[],
  productType: ProductType,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  if (!inspections.length) throw new Error("Tidak ada data inspeksi untuk diekspor");
  const label = productType === "HYDRANT" ? "Hydrant" : "Fire_Alarm";

  for (let i = 0; i < inspections.length; i++) {
    if (onProgress) onProgress(i + 1, inspections.length);
    const { content, filename } = buildSingleInspectionCSV(inspections[i], label);
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, filename);
    if (i < inspections.length - 1) await delay(300);
  }
}

/**
 * CSV entry point — dispatches to APAR or Vertical format.
 */
export async function exportInspectionsCSV(
  inspections: any[],
  productType: ProductType,
  filename: string,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const sorted = [...inspections].sort((a, b) => {
    const numA = parseInt(String(a.productNumber ?? "0"), 10);
    const numB = parseInt(String(b.productNumber ?? "0"), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return String(a.productNumber ?? "").localeCompare(String(b.productNumber ?? ""));
  });
  if (productType === "APAR") {
    await exportAparToCSV(sorted, filename);
  } else if (productType === "HYDRANT" || productType === "FIRE_ALARM") {
    await exportVerticalInspectionsCSV(sorted, productType, onProgress);
  } else {
    await exportAparToCSV(sorted, filename);
  }
}

// ─── PDF Export ─────────────────────────────────────────────────────────────

/**
 * Calculates the row height needed for a set of cell values given column widths and font size.
 */
function calcRowHeight(doc: jsPDF, rowData: string[], colWidths: number[], fontSize: number, minHeight: number, padding: number): number {
  doc.setFontSize(fontSize);
  let maxLines = 1;
  for (let i = 0; i < rowData.length; i++) {
    const text = String(rowData[i]);
    const maxW = colWidths[i] - padding * 2;
    if (maxW <= 0) continue;
    const lines = doc.splitTextToSize(text, maxW);
    if (lines.length > maxLines) maxLines = lines.length;
  }
  const lineHeight = fontSize * 0.4;
  return Math.max(minHeight, maxLines * lineHeight + padding * 2);
}

/**
 * Draws a table row with dynamic height: cells first, then text on top.
 * Uses splitTextToSize for proper word-boundary wrapping (no mid-word cuts).
 */
function drawTableRow(
  doc: jsPDF, rowData: string[], colWidths: number[],
  x0: number, y: number, rowH: number, fontSize: number, padding: number,
  fill?: { r: number; g: number; b: number },
) {
  doc.setFontSize(fontSize);
  let x = x0;
  for (let i = 0; i < rowData.length; i++) {
    if (fill) {
      doc.setFillColor(fill.r, fill.g, fill.b);
      doc.rect(x, y, colWidths[i], rowH, "FD");
    } else {
      doc.rect(x, y, colWidths[i], rowH, "S");
    }
    x += colWidths[i];
  }
  x = x0;
  const lineHeight = fontSize * 0.4;
  for (let i = 0; i < rowData.length; i++) {
    const maxW = colWidths[i] - padding * 2;
    if (maxW > 0) {
      const lines: string[] = doc.splitTextToSize(String(rowData[i]), maxW);
      for (let li = 0; li < lines.length; li++) {
        doc.text(lines[li], x + padding, y + padding + fontSize * 0.35 + li * lineHeight);
      }
    }
    x += colWidths[i];
  }
}

/**
 * Draws a checkmark (green) or cross (red) icon in a PDF cell.
 */
function drawCheckIcon(doc: jsPDF, cx: number, cy: number, size: number, isOk: boolean) {
  const half = size / 2;
  if (isOk) {
    // Green checkmark
    doc.setDrawColor(34, 139, 34);
    doc.setLineWidth(0.6);
    doc.line(cx - half * 0.4, cy, cx - half * 0.05, cy + half * 0.4);
    doc.line(cx - half * 0.05, cy + half * 0.4, cx + half * 0.5, cy - half * 0.35);
  } else {
    // Red cross
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.6);
    doc.line(cx - half * 0.35, cy - half * 0.35, cx + half * 0.35, cy + half * 0.35);
    doc.line(cx + half * 0.35, cy - half * 0.35, cx - half * 0.35, cy + half * 0.35);
  }
  // Reset to black border color
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
}

/**
 * Exports APAR inspections to PDF.
 * 12 columns: No. Produk, Merk, Jenis, Berat, Tgl Expired, Hose, Pressure, Handle, Body, Safety Pin, Lokasi, Foto
 * Photos use inspection-level photos (maintenances.inspection.photos[])
 */
/**
 * Builds a single APAR PDF for one contract group and returns the blob + filename.
 */
async function buildAparContractPDF(
  inspections: any[],
  logoBase64: string,
  allPhotos: (PDFImage | null)[],
  photoIndexMap: { start: number; count: number }[],
  globalStartIdx: number,
  pdfOptions?: PDFExportOptions,
): Promise<{ blob: Blob; filename: string }> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const padding = 1.5;
  const headerFontSize = 6;
  const dataFontSize = 5.5;
  const minRowH = 7;
  const thumbSize = 30;
  const thumbGap = 1;

  const showLogo = pdfOptions?.showLogo !== false; // default true
  const logoSize = 12;
  let y = margin;

  if (showLogo && logoBase64) {
    try { doc.addImage(logoBase64, "PNG", margin, y, logoSize, logoSize); } catch { /* ignore */ }
  }

  const titleX = showLogo && logoBase64 ? margin + logoSize + 4 : margin;
  const titleMaxW = pageWidth - titleX - margin;
  const titleText = pdfOptions?.customTitle || "MONITORING PELAKSANAAN PERAWATAN APAR";
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(titleText, titleX + titleMaxW / 2, y + 5, { align: "center", maxWidth: titleMaxW });

  const firstInsp = inspections[0];
  const customerName = firstInsp?.customerName || "N/A";
  const approvalDate = firstInsp?.maintenance?.updatedAt
    ? (typeof firstInsp.maintenance.updatedAt === "object" && "toDate" in firstInsp.maintenance.updatedAt
      ? firstInsp.maintenance.updatedAt.toDate() : new Date(firstInsp.maintenance.updatedAt))
    : firstInsp?.inspectionDateRaw || null;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`${customerName}, ${formatDateIndonesian(approvalDate)}`, titleX + titleMaxW / 2, y + 10, { align: "center" });

  y += logoSize + 6;

  const headers = [
    "No. Produk", "Merk APAR", "Jenis APAR", "Berat (KG)", "Tgl. Expired",
    "Hose", "Pressure", "Handle", "Body", "Safety Pin",
    "Lokasi", "Foto"
  ];
  const lokasiColW = 20;
  const photoColW = 102;
  const fixedColWidths = [14, 19, 17, 10, 20, 15, 15, 15, 15, 15];
  const colWidths = [...fixedColWidths, lokasiColW, photoColW];
  const checklistColStart = 5;

  const drawHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setDrawColor(0, 0, 0);
    doc.setTextColor(30, 30, 30);
    const hRowH = calcRowHeight(doc, headers, colWidths, headerFontSize, minRowH, padding);
    drawTableRow(doc, headers, colWidths, margin, y, hRowH, headerFontSize, padding, { r: 240, g: 240, b: 240 });
    y += hRowH;
    doc.setFont("helvetica", "normal");
    doc.setDrawColor(0, 0, 0);
    doc.setTextColor(50, 50, 50);
  };

  drawHeader();

  for (let inspIdx = 0; inspIdx < inspections.length; inspIdx++) {
    const insp = inspections[inspIdx];
    const checklist: any[] = insp.checklistDetails || insp.maintenance?.inspection?.checklist || [];
    const photoInfo = photoIndexMap[globalStartIdx + inspIdx];
    const inspPhotos = allPhotos.slice(photoInfo.start, photoInfo.start + photoInfo.count);
    const validPhotos = inspPhotos.filter((p): p is PDFImage => p !== null);

    let expDateFormatted = "N/A";
    const rawExpDate = insp.expirationDate ?? "";
    if (rawExpDate && rawExpDate !== "N/A") {
      const commaIdx = rawExpDate.indexOf(",");
      expDateFormatted = commaIdx > 0 ? rawExpDate.substring(0, commaIdx) : rawExpDate;
    }

    const textData = [
      insp.productNumber ?? "N/A",
      insp.productBrand ?? "N/A",
      insp.brandType ?? "N/A",
      insp.capacity ?? "N/A",
      expDateFormatted,
      "", "", "", "", "",
      insp.location ?? "N/A",
      "",
    ];

    let totalPhotoH = 0;
    if (validPhotos.length > 0) {
      const availW = photoColW - padding * 2;
      let lineW = 0;
      let lineMaxH = 0;
      for (let pi = 0; pi < validPhotos.length; pi++) {
        const { w, h } = fitImageToBox(validPhotos[pi].width, validPhotos[pi].height, thumbSize, thumbSize * 1.5);
        if (pi > 0 && lineW + w > availW) {
          totalPhotoH += lineMaxH + thumbGap;
          lineW = 0;
          lineMaxH = 0;
        }
        lineW += w + thumbGap;
        if (h > lineMaxH) lineMaxH = h;
      }
      totalPhotoH += lineMaxH + padding * 2;
    }

    const textRowH = calcRowHeight(doc, textData, colWidths, dataFontSize, minRowH, padding);
    const rowH = Math.max(textRowH, totalPhotoH, minRowH);

    if (y + rowH > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeader();
    }

    let x = margin;
    for (let i = 0; i < colWidths.length; i++) {
      doc.rect(x, y, colWidths[i], rowH, "S");
      x += colWidths[i];
    }

    doc.setFontSize(dataFontSize);
    doc.setTextColor(50, 50, 50);
    const textCols = [0, 1, 2, 3, 4, 10];
    for (const ci of textCols) {
      const cellX = margin + colWidths.slice(0, ci).reduce((a, b) => a + b, 0);
      doc.text(String(textData[ci]), cellX + padding, y + padding + dataFontSize * 0.35, { maxWidth: colWidths[ci] - padding * 2 });
    }

    for (let ci = 0; ci < APAR_CHECKLIST_COLUMNS.length; ci++) {
      const colName = APAR_CHECKLIST_COLUMNS[ci];
      const colIdx = checklistColStart + ci;
      const cellX = margin + colWidths.slice(0, colIdx).reduce((a, b) => a + b, 0);
      const item = checklist.find((c: any) => c.item === colName);
      const isOk = item ? item.status === true : false;
      const iconCx = cellX + colWidths[colIdx] / 2;
      const iconCy = y + padding + 3;
      drawCheckIcon(doc, iconCx, iconCy, 4, item ? isOk : false);
      if (!item) {
        doc.setFontSize(dataFontSize);
        doc.setTextColor(180, 180, 180);
        doc.text("-", iconCx - 1, iconCy + 1);
        doc.setTextColor(50, 50, 50);
      }
    }

    const photoColX = margin + colWidths.slice(0, 11).reduce((a, b) => a + b, 0);
    if (validPhotos.length > 0) {
      let px = photoColX + padding;
      let py = y + padding;
      let rowMaxH = 0;

      for (let pi = 0; pi < validPhotos.length; pi++) {
        const photo = validPhotos[pi];
        const { w, h } = fitImageToBox(photo.width, photo.height, thumbSize, thumbSize * 1.5);
        if (pi > 0 && px + w > photoColX + photoColW - padding) {
          px = photoColX + padding;
          py += rowMaxH + thumbGap;
          rowMaxH = 0;
        }
        if (h > rowMaxH) rowMaxH = h;
        try {
          doc.addImage(photo.base64, "JPEG", px, py, w, h);
        } catch {
          doc.setFillColor(230, 230, 230);
          doc.rect(px, py, w, h, "F");
        }
        px += w + thumbGap;
      }
    }

    y += rowH;
  }

  const pdfBlob = doc.output("blob");
  const monthStr = getCleanDate(firstInsp, true);
  const fname = buildStandardFilename("APAR", firstInsp?.contractNumber, "pdf", monthStr);

  return { blob: pdfBlob, filename: fname };
}

/**
 * Exports APAR inspections to PDF.
 * Groups by contractNumber — each contract gets a separate PDF file.
 */
export async function exportAparToPDF(
  inspections: any[],
  filename: string,
  pdfOptions?: PDFExportOptions,
): Promise<void> {
  if (!inspections.length) throw new Error("Tidak ada data inspeksi APAR untuk diekspor");

  // Pre-load logo once
  const logoBase64 = await loadLogoForPDF();

  // Pre-load ALL inspection photos once
  const allPhotoPromises: Promise<PDFImage | null>[] = [];
  const photoIndexMap: { start: number; count: number }[] = [];
  for (const insp of inspections) {
    const photos: string[] = insp.photos || insp.maintenance?.inspection?.photos || [];
    photoIndexMap.push({ start: allPhotoPromises.length, count: photos.length });
    for (const url of photos) {
      allPhotoPromises.push(loadImageForPDF(url));
    }
  }
  const allPhotos = await Promise.all(allPhotoPromises);

  // Group inspections by contractNumber + approval month (year-month only)
  const getApprovalMonthKey = (insp: any): string => {
    const updatedAt = insp.maintenance?.updatedAt;
    if (!updatedAt) return "unknown";
    const date = typeof updatedAt === "object" && "toDate" in updatedAt
      ? updatedAt.toDate() : new Date(updatedAt);
    if (isNaN(date.getTime())) return "unknown";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  const groups = new Map<string, { inspections: any[]; startIdx: number }>();
  for (let i = 0; i < inspections.length; i++) {
    const contract = inspections[i].contractNumber ?? "unknown";
    const dateKey = getApprovalMonthKey(inspections[i]);
    const key = `${contract}__${dateKey}`;
    if (!groups.has(key)) {
      groups.set(key, { inspections: [], startIdx: i });
    }
    groups.get(key)!.inspections.push(inspections[i]);
  }

  // If only one group, save directly with original filename
  if (groups.size === 1) {
    const group = Array.from(groups.values())[0];
    const { blob } = await buildAparContractPDF(
      group.inspections, logoBase64, allPhotos, photoIndexMap, group.startIdx, pdfOptions
    );
    downloadBlob(blob, `${filename}.pdf`);
    return;
  }

  // Multiple groups — generate one PDF per contract+date
  const groupList = Array.from(groups.values());
  for (let gi = 0; gi < groupList.length; gi++) {
    const group = groupList[gi];
    const { blob, filename: fname } = await buildAparContractPDF(
      group.inspections, logoBase64, allPhotos, photoIndexMap, group.startIdx, pdfOptions
    );
    downloadBlob(blob, fname);
    if (gi < groupList.length - 1) await delay(300);
  }
}

interface PDFImage {
  base64: string;
  width: number;
  height: number;
}

/**
 * Loads an image URL as base64 + dimensions for PDF embedding.
 * Uses a server-side proxy to bypass CORS, then draws through canvas
 * to apply EXIF orientation (mobile photos taken in portrait).
 * Returns null on failure (graceful degradation).
 */
async function loadImageForPDF(url: string): Promise<PDFImage | null> {
  if (!url || typeof window === "undefined") return null;
  try {
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // Load through Image element — browser applies EXIF orientation
    const result = await new Promise<PDFImage | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Draw to canvas — this bakes in the EXIF rotation
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL("image/jpeg", 0.7);
        // Use canvas dimensions (post-EXIF-rotation)
        resolve({ base64, width: canvas.width, height: canvas.height });
      };
      img.onerror = () => resolve(null);
      img.src = blobUrl;
    });

    URL.revokeObjectURL(blobUrl);
    return result;
  } catch {
    return null;
  }
}

/**
 * Calculates render dimensions for an image constrained to a max box,
 * preserving aspect ratio.
 */
function fitImageToBox(imgW: number, imgH: number, maxW: number, maxH: number): { w: number; h: number } {
  if (imgW <= 0 || imgH <= 0) return { w: maxW, h: maxH };
  const ratio = imgW / imgH;
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  return { w, h };
}

/**
 * Formats a date as "DD MMMM YYYY" in Indonesian.
 */
function formatDateIndonesian(date: Date | null | undefined): string {
  if (!date) return "-";
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "-";
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Loads a local image (same-origin) as base64 — no proxy needed.
 */
async function loadLocalImageForPDF(path: string): Promise<string> {
  if (!path || typeof window === "undefined") return "";
  try {
    const response = await fetch(path);
    if (!response.ok) return "";
    const blob = await response.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

/**
 * Loads the company logo as base64 for PDF embedding.
 */
async function loadLogoForPDF(): Promise<string> {
  return await loadLocalImageForPDF("/images/logo/logo-light.png");
}

/**
 * Exports a single vertical inspection (Hydrant/Fire Alarm) to PDF.
 * Layout: Letterhead (logo + title + customer/date) → 3-column table with photos
 * Same format for both Hydrant and Fire Alarm.
 */
async function buildSingleInspectionPDF(insp: any, productTypeLabel: string, pdfOptions?: PDFExportOptions): Promise<{ blob: Blob; filename: string }> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const padding = 2.5;
  const thumbSize = 38;
  const thumbGap = 3;
  const centerX = pageWidth / 2;
  let y = margin;

  const showLogo = pdfOptions?.showLogo !== false; // default true

  // Load logo
  const logoBase64 = showLogo ? await loadLogoForPDF() : "";

  // ─── LETTERHEAD ───────────────────────────────────────────────────────────

  // Logo (left of title)
  const logoSize = 16;
  if (showLogo && logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", margin, y, logoSize, logoSize);
    } catch { /* ignore */ }
  }

  // Title
  const brandType = insp.brandType || insp.maintenance?.productType || "";
  let titleSuffix = "";
  if (productTypeLabel === "Hydrant") {
    if (brandType === "HPO") titleSuffix = " PORTABLE";
    else if (brandType === "HPE") titleSuffix = " PERMANENT";
  }

  const defaultTitle = `MONITORING PELAKSANAAN PERAWATAN ${productTypeLabel.toUpperCase()}${titleSuffix}`;
  const titleText = pdfOptions?.customTitle || defaultTitle;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  const titleX = showLogo && logoBase64 ? margin + logoSize + 4 : margin;
  const titleMaxW = pageWidth - titleX - margin;
  doc.text(titleText, titleX + titleMaxW / 2, y + 6, { align: "center", maxWidth: titleMaxW });

  // Subtitle: "{customerName}, {date}"
  const approvalDate = insp.maintenance?.updatedAt
    ? (typeof insp.maintenance.updatedAt === "object" && "toDate" in insp.maintenance.updatedAt
      ? insp.maintenance.updatedAt.toDate()
      : new Date(insp.maintenance.updatedAt))
    : insp.inspectionDateRaw || null;
  const customerName = insp.customerName || "N/A";
  const subtitleText = `${customerName}, ${formatDateIndonesian(approvalDate)}`;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(subtitleText, titleX + titleMaxW / 2, y + 12, { align: "center" });

  y += logoSize + 8; // spacing below letterhead

  // ─── TABLE ────────────────────────────────────────────────────────────────

  const checklist: any[] = insp.checklistDetails || insp.maintenance?.inspection?.checklist || [];
  const tableHeaders = ["No.", "Uraian Kegiatan", "Bukti Kegiatan"];
  const col1W = 12;
  const col2W = 40;
  const col3W = pageWidth - margin * 2 - col1W - col2W;
  const colWidths = [col1W, col2W, col3W];
  const headerFontSize = 8;
  const dataFontSize = 7;
  const minRowH = 10;

  // Pre-load ALL photos with dimensions
  const allPhotoPromises: Promise<PDFImage | null>[] = [];
  const photoIndexMap: { start: number; count: number }[] = [];
  for (const item of checklist) {
    const photos: string[] = item.photos || [];
    photoIndexMap.push({ start: allPhotoPromises.length, count: photos.length });
    for (const url of photos) {
      allPhotoPromises.push(loadImageForPDF(url));
    }
  }
  const allPhotos = await Promise.all(allPhotoPromises);

  // Table header
  doc.setFont("helvetica", "bold");
  doc.setDrawColor(0, 0, 0);
  doc.setTextColor(30, 30, 30);
  const hRowH = calcRowHeight(doc, tableHeaders, colWidths, headerFontSize, minRowH, padding);
  drawTableRow(doc, tableHeaders, colWidths, margin, y, hRowH, headerFontSize, padding, { r: 240, g: 240, b: 240 });
  y += hRowH;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setDrawColor(0, 0, 0);
  doc.setTextColor(50, 50, 50);

  for (let idx = 0; idx < checklist.length; idx++) {
    const item = checklist[idx];
    const photoInfo = photoIndexMap[idx];
    const itemPhotos = allPhotos.slice(photoInfo.start, photoInfo.start + photoInfo.count);
    const validPhotos = itemPhotos.filter((p): p is PDFImage => p !== null);

    // Calculate photo layout: uniform width, height based on aspect ratio
    const photosPerRow = Math.max(1, Math.floor((col3W - padding * 2 + thumbGap) / (thumbSize + thumbGap)));

    // Calculate max photo height per row (tallest photo in each row determines row height)
    let totalPhotoH = 0;
    if (validPhotos.length > 0) {
      const rowCount = Math.ceil(validPhotos.length / photosPerRow);
      for (let row = 0; row < rowCount; row++) {
        let maxH = 0;
        for (let col = 0; col < photosPerRow; col++) {
          const pi = row * photosPerRow + col;
          if (pi >= validPhotos.length) break;
          const photo = validPhotos[pi];
          const { h } = fitImageToBox(photo.width, photo.height, thumbSize, thumbSize * 1.5);
          if (h > maxH) maxH = h;
        }
        totalPhotoH += maxH + thumbGap;
      }
      totalPhotoH += padding * 2;
    }

    // Calculate row height
    const textData = [String(idx + 1), item.detail || item.item || "N/A", ""];
    const textRowH = calcRowHeight(doc, textData, colWidths, dataFontSize, minRowH, padding);
    const rowH = Math.max(textRowH, totalPhotoH, minRowH);

    // Page break
    if (y + rowH > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    // Cell borders
    let x = margin;
    for (let i = 0; i < colWidths.length; i++) {
      doc.rect(x, y, colWidths[i], rowH, "S");
      x += colWidths[i];
    }

    // Text: No. + Uraian Kegiatan
    doc.setFontSize(dataFontSize);
    doc.setTextColor(50, 50, 50);
    doc.text(String(idx + 1), margin + padding, y + padding + dataFontSize * 0.35);
    doc.text(
      item.detail || item.item || "N/A",
      margin + col1W + padding,
      y + padding + dataFontSize * 0.35,
      { maxWidth: col2W - padding * 2 }
    );

    // Photos: uniform width, original aspect ratio, side by side with wrapping
    if (validPhotos.length > 0) {
      const photoX0 = margin + col1W + col2W + padding;
      let px = photoX0;
      let py = y + padding;
      let rowMaxH = 0;

      for (let pi = 0; pi < validPhotos.length; pi++) {
        // Wrap to next row
        if (pi > 0 && pi % photosPerRow === 0) {
          px = photoX0;
          py += rowMaxH + thumbGap;
          rowMaxH = 0;
        }
        const photo = validPhotos[pi];
        const { w, h } = fitImageToBox(photo.width, photo.height, thumbSize, thumbSize * 1.5);
        if (h > rowMaxH) rowMaxH = h;
        try {
          doc.addImage(photo.base64, "JPEG", px, py, w, h);
        } catch {
          doc.setFillColor(230, 230, 230);
          doc.rect(px, py, w, h, "F");
        }
        px += thumbSize + thumbGap; // uniform horizontal spacing
      }
    } else {
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text("Tidak ada foto", margin + col1W + col2W + padding, y + padding + 4);
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(dataFontSize);
    }

    y += rowH;
  }

  const pdfBlob = doc.output("blob");
  const dateStr = getCleanDate(insp);
  const filename = buildStandardFilename(productTypeLabel, insp.contractNumber, "pdf", dateStr, insp.productNumber);

  return { blob: pdfBlob, filename };
}

/**
 * Exports vertical inspections to PDF — one file per inspection.
 */
export async function exportVerticalInspectionsPDF(
  inspections: any[],
  productType: ProductType,
  onProgress?: (current: number, total: number) => void,
  pdfOptions?: PDFExportOptions,
): Promise<void> {
  if (!inspections.length) throw new Error("Tidak ada data inspeksi untuk diekspor");
  const label = productType === "HYDRANT" ? "Hydrant" : "Fire_Alarm";

  for (let i = 0; i < inspections.length; i++) {
    if (onProgress) onProgress(i + 1, inspections.length);
    const { blob, filename } = await buildSingleInspectionPDF(inspections[i], label, pdfOptions);
    downloadBlob(blob, filename);
    if (i < inspections.length - 1) await delay(300);
  }
}

/**
 * PDF entry point — dispatches to APAR or Vertical format.
 */
export async function exportInspectionsPDF(
  inspections: any[],
  productType: ProductType,
  filename: string,
  onProgress?: (current: number, total: number) => void,
  pdfOptions?: PDFExportOptions,
): Promise<void> {
  const sorted = [...inspections].sort((a, b) => {
    const numA = parseInt(String(a.productNumber ?? "0"), 10);
    const numB = parseInt(String(b.productNumber ?? "0"), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return String(a.productNumber ?? "").localeCompare(String(b.productNumber ?? ""));
  });
  if (productType === "APAR") {
    await exportAparToPDF(sorted, filename, pdfOptions);
  } else if (productType === "HYDRANT" || productType === "FIRE_ALARM") {
    await exportVerticalInspectionsPDF(sorted, productType, onProgress, pdfOptions);
  } else {
    await exportAparToPDF(sorted, filename, pdfOptions);
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
  return str.replace(/[^a-zA-Z0-9_\-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").substring(0, 50);
}

/**
 * Extracts a clean date string from inspection data.
 * Returns YYYY-MM-DD for full date or YYYY-MM for month-only.
 */
function getCleanDate(insp: any, monthOnly: boolean = false): string {
  const updatedAt = insp.maintenance?.updatedAt;
  let date: Date | null = null;
  if (updatedAt) {
    date = typeof updatedAt === "object" && "toDate" in updatedAt
      ? updatedAt.toDate() : new Date(updatedAt);
  }
  if (!date || isNaN(date.getTime())) {
    date = insp.inspectionDateRaw || null;
  }
  if (!date || isNaN(date.getTime())) {
    return monthOnly ? new Date().toISOString().slice(0, 7) : new Date().toISOString().slice(0, 10);
  }
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return monthOnly ? `${yyyy}-${mm}` : `${yyyy}-${mm}-${dd}`;
}

/**
 * Builds a standardized filename: laporan_{type}_{contract}_{date}.{ext}
 * For Hydrant/Fire Alarm also includes product number.
 */
function buildStandardFilename(
  productType: string,
  contractNumber: string,
  ext: string,
  dateStr: string,
  productNumber?: string,
): string {
  const type = productType.toLowerCase().replace(/_/g, "-");
  const contract = sanitizeFilename(contractNumber || "unknown");
  if (productNumber) {
    const product = sanitizeFilename(productNumber || "unknown");
    return `laporan_inspeksi_${type}_${contract}_${product}_${dateStr}.${ext}`;
  }
  return `laporan_inspeksi_${type}_${contract}_${dateStr}.${ext}`;
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
