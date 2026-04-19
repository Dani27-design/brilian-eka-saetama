import jsPDF from "jspdf";
import { CertificateData } from "./pdfCertificate";
import { generateBothSignatureQRCodes } from "./qrSignatureGenerator";
import { getCachedCompanyInfo } from "./companyDataFetcher";

async function loadImageAsBase64(imagePath: string): Promise<string> {
  try {
    // Check if we're running on the server (Node.js) or client (browser)
    if (typeof window === 'undefined') {
      // Server-side: skip image loading for now
      console.warn("Image loading not supported on server-side, skipping logo");
      return "";
    }

    // Client-side: use browser APIs
    const img = new Image();
    img.crossOrigin = "anonymous";

    return new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Get base64 data
        const base64 = canvas.toDataURL("image/png");
        resolve(base64);
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = imagePath;
    });
  } catch (error) {
    console.warn("Failed to load logo image:", error);
    return ""; // Return empty string if logo fails to load
  }
}

/**
 * Assumptions:
 * - `getCachedCompanyInfo(): Promise<{ companyName: string; phone: string; email: string; address: string }>` exists.
 * - `generateBothSignatureQRCodes(...)` exists and returns { inspectorQR: string, approverQR: string } (dataURLs).
 * - `loadImageAsBase64(path: string): Promise<string>` exists (or use your existing implementation).
 * - `CertificateData` shape must contain fields used below (adjust types to your project).
 */

/** --- Types (adjust to your project) --- */
interface PDFCertificateConfig {
  pageSize: "a4" | "letter";
  orientation: "portrait" | "landscape";
  margins: { top: number; right: number; bottom: number; left: number };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    success: string;
    danger: string;
    accent: string;
    background: string;
    border: string;
  };
  fonts: {
    title: number;
    subtitle: number;
    body: number;
    small: number;
    tiny: number;
  };
}

/** --- Default compact corporate config (v4 final) --- */
const DEFAULT_PDF_CONFIG: PDFCertificateConfig = {
  pageSize: "a4",
  orientation: "portrait",
  margins: { top: 10, right: 20, bottom: 10, left: 20 },
  colors: {
    primary: "#0f172a",
    secondary: "#374151",
    text: "#1f2937",
    success: "#15803d",
    danger: "#b91c1c",
    accent: "#7f1d1d",
    background: "#ffffff",
    border: "#e5e7eb",
  },
  fonts: {
    title: 12,
    subtitle: 9,
    body: 8,
    small: 7.5,
    tiny: 6.5,
  },
};

/** --- Helper: draw header with logo at left and centered company text --- */
function drawHeader(
  pdf: jsPDF,
  cfg: PDFCertificateConfig,
  logoBase64: string,
  companyInfo: {
    companyName: string;
    address: string;
    phone: string;
    email: string;
  },
): number {
  const { margins, colors, fonts } = cfg;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const left = margins.left;
  const top = margins.top;

  // Logo (left)
  const logoW = 15;
  const logoH = 15;
  if (logoBase64) {
    try {
      pdf.addImage(logoBase64, "PNG", left, top, logoW, logoH);
    } catch {
      // ignore if image invalid
    }
  }

  // Company title centered horizontally across the page, but vertically aligned with logo top
  const centerX = pageWidth / 2;
  const nameY = top + 3;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(fonts.subtitle);
  pdf.setTextColor(colors.primary);
  pdf.text(String(companyInfo.companyName || "Company Name"), centerX, nameY, { align: "center" });

  // Address + contacts under name (compact)
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(fonts.small);
  pdf.setTextColor(colors.secondary);
  pdf.text(String(companyInfo.address || "Address"), centerX, nameY + 5, {
    align: "center",
    maxWidth: pageWidth,
    // maxWidth: pageWidth - margins.left - margins.right,
  });
  pdf.text(
    `${companyInfo.phone || "Phone"}  •  ${companyInfo.email || "Email"}`,
    centerX,
    nameY + 11,
    { align: "center" },
  );

  // Thin divider line below header
  const dividerY = top + Math.max(logoH, 15) + 3;
  pdf.setDrawColor(cfg.colors.border);
  pdf.setLineWidth(0.35);
  pdf.line(margins.left, dividerY, pageWidth - margins.right, dividerY);

  // Return Y coordinate to start next content (small gap)
  return dividerY + 3;
}

/** --- Helper: draw centered title block compact --- */
function drawTitleBlock(
  pdf: jsPDF,
  cfg: PDFCertificateConfig,
  data: CertificateData,
  y: number,
): number {
  const { margins, colors, fonts } = cfg;
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(fonts.title);
  pdf.setTextColor(colors.primary);
  pdf.text("SERTIFIKAT INSPEKSI", pageWidth / 2, y + 5, {
    align: "center",
  });

  // Subtitle (product)
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(fonts.body);
  pdf.setTextColor(colors.secondary);
  pdf.text(
    `Peralatan Keselamatan Kebakaran : ${String(data.productType || "Peralatan")}`,
    pageWidth / 2,
    y + 11,
    { align: "center" },
  );

  // Certificate number (small)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(fonts.small);
  pdf.setTextColor(colors.secondary);
  pdf.text(`No. Sertifikat: ${String(data.certificateNumber || "N/A")}`, pageWidth / 2, y + 16, {
    align: "center",
  });

  return y + 22;
}

/** --- Helper: two-column info block compact --- */
function drawTwoColumnInfo(
  pdf: jsPDF,
  cfg: PDFCertificateConfig,
  title: string,
  rows: { label: string; value: string }[][],
  y: number,
): number {
  const { margins, colors, fonts } = cfg;
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Section title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(fonts.subtitle);
  pdf.setTextColor(colors.accent);
  pdf.text(title, margins.left, y + 4);
  y += 8;

  const usableWidth = pageWidth - margins.left - margins.right;
  const colWidth = usableWidth / 2;
  const lineHeight = 5;

  // Calculate max label width for alignment within this section
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(cfg.fonts.small);
  let maxLabelW = 0;
  rows.forEach((row) => {
    row.forEach((cell) => {
      const w = pdf.getTextWidth(cell.label);
      if (w > maxLabelW) maxLabelW = w;
    });
  });
  const labelOffset = Math.min(maxLabelW + 3, colWidth * 0.45); // cap at 45% of column

  rows.forEach((row) => {
    let x = margins.left;
    row.forEach((cell) => {
      // Label
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(cfg.fonts.small);
      pdf.setTextColor(colors.text);
      pdf.text(cell.label, x, y + 1);

      // Value — positioned right after label with consistent offset
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(cfg.fonts.small);
      pdf.setTextColor(colors.secondary);
      const valueX = x + labelOffset;
      const maxWidth = colWidth - labelOffset - 4;
      const textValue = typeof cell.value === 'string' ? cell.value : (cell.value ? String(cell.value) : "-");
      if (maxWidth > 0) {
        pdf.text(textValue, valueX, y + 1, { maxWidth });
      }

      x += colWidth;
    });
    y += lineHeight;
  });

  return y + 2;
}

/** --- Helper: draw vertical borders for a table row --- */
function drawVerticalBorders(
  pdf: jsPDF, x0: number, y: number, rowH: number, colW: number[], borderColor: string,
) {
  pdf.setDrawColor(borderColor);
  let x = x0;
  // Left border
  pdf.line(x, y, x, y + rowH);
  for (let i = 0; i < colW.length; i++) {
    x += colW[i];
    // Right border of each column
    pdf.line(x, y, x, y + rowH);
  }
}

/** --- Helper: checklist table compact --- */
function drawChecklistTable(
  pdf: jsPDF,
  cfg: PDFCertificateConfig,
  data: CertificateData,
  y: number,
): number {
  const { margins, colors, fonts } = cfg;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const tableW = pageWidth - margins.left - margins.right;

  const rowH = 5.5;
  // Proportional columns: No(8) | Item(remaining) | Status(15) | Keterangan(42)
  const colW = [8, tableW - 8 - 15 - 42, 15, 42];
  const headers = ["No.", "Item Inspeksi", "Status", "Keterangan"];

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(fonts.subtitle);
  pdf.setTextColor(colors.primary);
  pdf.text("Hasil Inspeksi", margins.left, y + 6);
  y += 10;

  // Helper to draw header row (reusable for page breaks)
  const drawTableHeader = () => {
    // Header background + border
    pdf.setFillColor(245, 245, 245);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(margins.left, y, tableW, rowH, "FD");
    drawVerticalBorders(pdf, margins.left, y, rowH, colW, "#000000");

    // Header text
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(fonts.small);
    pdf.setTextColor(colors.text);
    let x = margins.left;
    headers.forEach((h, i) => {
      // Center text in header cells
      const cellCenter = x + colW[i] / 2;
      pdf.text(h, cellCenter, y + 3.8, { align: "center" });
      x += colW[i];
    });
    y += rowH;
  };

  drawTableHeader();

  // Data rows
  data.checklistResults.details.forEach((it, idx) => {
    if (y > pdf.internal.pageSize.getHeight() - margins.bottom - 20) {
      pdf.addPage();
      y = margins.top;
      drawTableHeader();
    }

    // Row border (horizontal bottom + vertical columns)
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.rect(margins.left, y, tableW, rowH, "S");
    drawVerticalBorders(pdf, margins.left, y, rowH, colW, "#000000");

    let x = margins.left;

    // No — centered
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(fonts.small);
    pdf.setTextColor(colors.secondary);
    pdf.text(String(idx + 1), x + colW[0] / 2, y + 3.8, { align: "center" });
    x += colW[0];

    // Item — left aligned
    const itemText = String(it.item || `Item ${idx + 1}`);
    pdf.text(itemText, x + 2, y + 3.8, { maxWidth: colW[1] - 4 });
    x += colW[1];

    // Status — green check or red cross icon, centered
    const iconCx = x + colW[2] / 2;
    const iconCy = y + rowH / 2;
    const iconHalf = 1.8;
    pdf.setLineWidth(0.5);
    if (it.status) {
      pdf.setDrawColor(34, 139, 34);
      pdf.line(iconCx - iconHalf * 0.4, iconCy, iconCx - iconHalf * 0.05, iconCy + iconHalf * 0.4);
      pdf.line(iconCx - iconHalf * 0.05, iconCy + iconHalf * 0.4, iconCx + iconHalf * 0.5, iconCy - iconHalf * 0.35);
    } else {
      pdf.setDrawColor(220, 38, 38);
      pdf.line(iconCx - iconHalf * 0.35, iconCy - iconHalf * 0.35, iconCx + iconHalf * 0.35, iconCy + iconHalf * 0.35);
      pdf.line(iconCx + iconHalf * 0.35, iconCy - iconHalf * 0.35, iconCx - iconHalf * 0.35, iconCy + iconHalf * 0.35);
    }
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    x += colW[2];

    // Keterangan — left aligned
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(colors.secondary);
    const remarksText = String(it.remarks || "-");
    pdf.text(remarksText, x + 2, y + 3.8, { maxWidth: colW[3] - 4 });

    y += rowH;
  });

  return y + 6;
}

/** --- Helper: signatures compact --- */
function drawSignatures(
  pdf: jsPDF,
  cfg: PDFCertificateConfig,
  data: CertificateData,
  inspectorQR: string,
  approverQR: string,
  y: number,
): number {
  const { margins, colors, fonts } = cfg;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const leftX = margins.left + 45;
  const rightX = pageWidth - margins.right - 45;
  const qr = 16;
  y += 15;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(cfg.fonts.body);
  pdf.setTextColor(colors.secondary);
  pdf.text("Diperiksa Oleh", leftX, y, { align: "center" });
  pdf.text("Disetujui Oleh", rightX, y, { align: "center" });

  if (inspectorQR) {
    try {
      pdf.addImage(inspectorQR, "PNG", leftX - qr / 2, y + 3, qr, qr);
    } catch {}
  }
  if (approverQR) {
    try {
      pdf.addImage(approverQR, "PNG", rightX - qr / 2, y + 3, qr, qr);
    } catch {}
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(cfg.fonts.small);
  pdf.setTextColor(colors.text);
  pdf.text("Petugas Inspeksi", leftX, y + 25, { align: "center" });
  pdf.text(String(data.engineerNames[0] || "Petugas"), leftX, y + 29, {
    align: "center",
  });
  pdf.text(String(data.inspectionDate || "-"), leftX, y + 33, { align: "center" });

  pdf.text("Penanggung Jawab", rightX, y + 25, { align: "center" });
  pdf.text(String(data.approvedBy || "Admin"), rightX, y + 29, { align: "center" });
  pdf.text(String(data.approvedAt || "-"), rightX, y + 33, { align: "center" });

  // Footer note
  pdf.setFontSize(cfg.fonts.tiny);
  pdf.setTextColor(colors.secondary);
  pdf.text(
    "Sertifikat ini ditandatangani secara digital. Pindai kode QR untuk verifikasi.",
    pageWidth / 2,
    y + 42,
    {
      align: "center",
      maxWidth: pageWidth - margins.left - margins.right,
    },
  );

  return y + 48;
}

/** --- Main exported generator (v4 Corporate Compact) --- */
export async function generatePDFCertificate(
  data: CertificateData | CertificateData[],
  inspectorId: string,
  approverId: string,
  configOverrides: Partial<PDFCertificateConfig> = {},
): Promise<Blob> {
  const cfg: PDFCertificateConfig = {
    ...DEFAULT_PDF_CONFIG,
    ...configOverrides,
  } as PDFCertificateConfig;

  // Handle both single certificate and array of certificates
  const certificates = Array.isArray(data) ? data : [data];

  const pdf = new jsPDF({
    orientation: cfg.orientation,
    unit: "mm",
    format: cfg.pageSize,
  });

  // 1) Company info & logo (load once, reuse for all pages)
  const companyInfo = await getCachedCompanyInfo();
  let logoBase64 = "";
  try {
    logoBase64 = await loadImageAsBase64("/images/logo/logo-light.png");
  } catch {
    // ok to continue w/o logo
  }

  // 2) Generate each certificate page
  for (let i = 0; i < certificates.length; i++) {
    const certData = certificates[i];

    // Add new page for subsequent certificates
    if (i > 0) {
      pdf.addPage();
    }

    // QRs for this specific certificate
    let inspectorQR = "";
    let approverQR = "";
    try {
      const q = await generateBothSignatureQRCodes(
        inspectorId,
        certData.engineerNames[0] || "Inspector",
        approverId,
        certData.approvedBy || "Approver",
        certData.certificateNumber,
        `inspection_${certData.certificateNumber}`,
        certData.inspectionDate,
        certData.productNumber,
        certData.contractNumber,
      );
      inspectorQR = q.inspectorQR;
      approverQR = q.approverQR;
    } catch {
      // ignore QR generation errors
    }

    // 3) Draw sections for this certificate
    let y = drawHeader(pdf, cfg, logoBase64, {
      companyName: companyInfo.companyName,
      address: companyInfo.address,
      phone: companyInfo.phone,
      email: companyInfo.email,
    });

    y = drawTitleBlock(pdf, cfg, certData, y);

    y = drawTwoColumnInfo(
      pdf,
      cfg,
      "KONTRAK",
      [
        [
          { label: "No. Kontrak:", value: certData.contractNumber || "—" },
          { label: "Pelanggan:", value: certData.customerName || "—" },
        ],
        [
          { label: "Tgl. Terbit:", value: certData.issueDate || "—" },
          { label: "Berlaku s/d:", value: certData.validUntil || "—" },
        ],
      ],
      y,
    );

    y = drawTwoColumnInfo(
      pdf,
      cfg,
      "PRODUK",
      [
        [
          { label: "No. Produk:", value: certData.productNumber || "—" },
          { label: "Nama Produk:", value: certData.productName || "—" },
        ],
        [
          { label: "Merk:", value: certData.productBrand || "—" },
          { label: "Lokasi:", value: certData.location || "—" },
        ],
      ],
      y,
    );

    y = drawTwoColumnInfo(
      pdf,
      cfg,
      "INSPEKSI",
      [
        [
          { label: "Tgl. Inspeksi:", value: certData.inspectionDate || "—" },
          { label: "Petugas:", value: certData.engineerNames.join(", ") || "—" },
        ],
        [
          {
            label: "Total Item:",
            value: String(certData.checklistResults.totalItems || 0),
          },
          {
            label: "Kelulusan:",
            value: `${Math.round(
              ((certData.checklistResults.passedItems || 0) /
                Math.max(1, certData.checklistResults.totalItems || 1)) *
                100,
            )}%`,
          },
        ],
      ],
      y,
    );

    y = drawChecklistTable(pdf, cfg, certData, y);

    y = drawSignatures(pdf, cfg, certData, inspectorQR, approverQR, y);
  }

  // 4) Return Blob
  return pdf.output("blob");
}

/**
 * Downloads PDF certificate directly to user's device
 * Convenience function for immediate download
 *
 * @param certificateData - Complete certificate data
 * @param inspectorId - ID of the inspector for QR signature
 * @param approverId - ID of the approver for QR signature
 * @param filename - Optional filename (without extension)
 *
 * @example
 * await downloadPDFCertificate(certData, "inspector123", "approver456", "certificate_PRD001");
 */
export async function downloadPDFCertificate(
  certificateData: CertificateData,
  inspectorId: string,
  approverId: string,
  filename?: string,
): Promise<void> {
  try {
    const pdfBlob = await generatePDFCertificate(
      certificateData,
      inspectorId,
      approverId,
    );

    // Create download filename
    const downloadFilename = filename
      ? `${filename}.pdf`
      : `certificate_${certificateData.certificateNumber}.pdf`;

    // Create and trigger download
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");

    link.href = url;
    link.download = downloadFilename;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading PDF certificate:", error);
    throw new Error("Failed to download PDF certificate");
  }
}
