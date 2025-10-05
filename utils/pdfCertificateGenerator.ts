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
  pdf.text("CERTIFICATE OF INSPECTION", pageWidth / 2, y + 5, {
    align: "center",
  });

  // Subtitle (product)
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(fonts.body);
  pdf.setTextColor(colors.secondary);
  pdf.text(
    `Fire Safety Equipment — ${String(data.productType || "Equipment")}`,
    pageWidth / 2,
    y + 11,
    { align: "center" },
  );

  // Certificate number (small)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(fonts.small);
  pdf.setTextColor(colors.secondary);
  pdf.text(`Certificate No: ${String(data.certificateNumber || "N/A")}`, pageWidth / 2, y + 16, {
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

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(fonts.subtitle);
  pdf.setTextColor(colors.accent);
  pdf.text(title, margins.left, y + 4);
  y += 8;

  const usableWidth = pageWidth - margins.left - margins.right;
  const colWidth = usableWidth / 2;
  const lineHeight = 5; // compact

  rows.forEach((row) => {
    let x = margins.left;
    row.forEach((cell) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(cfg.fonts.small);
      pdf.setTextColor(colors.text);
      pdf.text(cell.label, x, y + 1);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(cfg.fonts.small);
      pdf.setTextColor(colors.secondary);

      // limit value width to colWidth - label offset
      const valueX = x + 28;
      const maxWidth = colWidth - 28 - 6;
      // Ensure value is a string
      const textValue = typeof cell.value === 'string' ? cell.value : (cell.value ? String(cell.value) : "-");
      pdf.text(textValue, valueX, y + 1, { maxWidth });

      x += colWidth;
    });
    y += lineHeight;
  });

  return y + 2;
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

  const rowH = 5.2; // compact
  const colW = [10, tableW - 10 - 20 - 40, 20, 40]; // No | Item | Status | Remarks

  // Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(fonts.subtitle);
  pdf.setTextColor(colors.primary);
  pdf.text("Detailed Inspection Results", margins.left, y + 6);
  y += 10;

  // Header background
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margins.left, y, tableW, rowH, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(fonts.small);
  pdf.setTextColor(colors.text);

  let x = margins.left;
  ["No.", "Inspection Item", "Status", "Remarks"].forEach((h, i) => {
    pdf.text(h, x + 2, y + 3.6);
    x += colW[i];
  });

  y += rowH;
  pdf.setDrawColor(colors.border);
  pdf.line(margins.left, y, margins.left + tableW, y);

  // Rows
  data.checklistResults.details.forEach((it, idx) => {
    if (y > pdf.internal.pageSize.getHeight() - margins.bottom - 60) {
      pdf.addPage();
      y = margins.top;
    }

    x = margins.left;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(fonts.small);
    pdf.setTextColor(colors.secondary);

    // No
    pdf.text(String(idx + 1), x + 2, y + 3.6);
    x += colW[0];

    // Item (wrap if needed)
    const itemText = String(it.item || `Item ${idx + 1}`);
    pdf.text(itemText, x + 2, y + 3.6, { maxWidth: colW[1] - 4 });
    x += colW[1];

    // Status
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(it.status ? cfg.colors.success : cfg.colors.danger);
    pdf.text(it.status ? "PASS" : "FAIL", x + 2, y + 3.6);
    x += colW[2];

    // Remarks
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(colors.secondary);
    const remarksText = String(it.remarks || "-");
    pdf.text(remarksText, x + 2, y + 3.6, { maxWidth: colW[3] - 4 });

    y += rowH;
    pdf.setDrawColor(colors.border);
    pdf.line(margins.left, y, margins.left + tableW, y);
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
  pdf.text("Inspected By", leftX, y, { align: "center" });
  pdf.text("Approved By", rightX, y, { align: "center" });

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
  pdf.text("Inspection Engineer", leftX, y + 25, { align: "center" });
  pdf.text(String(data.engineerNames[0] || "Inspector Name"), leftX, y + 29, {
    align: "center",
  });
  pdf.text(String(data.inspectionDate || "-"), leftX, y + 33, { align: "center" });

  pdf.text("Inspection Manager", rightX, y + 25, { align: "center" });
  pdf.text(String(data.approvedBy || "Approver"), rightX, y + 29, { align: "center" });
  pdf.text(String(data.approvedAt || "-"), rightX, y + 33, { align: "center" });

  // Footer note
  pdf.setFontSize(cfg.fonts.tiny);
  pdf.setTextColor(colors.secondary);
  pdf.text(
    "This certificate is digitally signed. Scan QR codes to verify authenticity.",
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
  data: CertificateData,
  inspectorId: string,
  approverId: string,
  configOverrides: Partial<PDFCertificateConfig> = {},
): Promise<Blob> {
  const cfg: PDFCertificateConfig = {
    ...DEFAULT_PDF_CONFIG,
    ...configOverrides,
  } as PDFCertificateConfig;

  const pdf = new jsPDF({
    orientation: cfg.orientation,
    unit: "mm",
    format: cfg.pageSize,
  });

  // 1) Company info & logo
  const companyInfo = await getCachedCompanyInfo();
  let logoBase64 = "";
  try {
    logoBase64 = await loadImageAsBase64("/images/logo/logo-light.png");
  } catch {
    // ok to continue w/o logo
  }

  // 2) QRs (safe to try; if fails we'll continue)
  let inspectorQR = "";
  let approverQR = "";
  try {
    const q = await generateBothSignatureQRCodes(
      inspectorId,
      data.engineerNames[0] || "Inspector",
      approverId,
      data.approvedBy || "Approver",
      data.certificateNumber,
      `inspection_${data.certificateNumber}`,
      data.inspectionDate,
      data.productNumber,
      data.contractNumber,
    );
    inspectorQR = q.inspectorQR;
    approverQR = q.approverQR;
  } catch {
    // ignore QR generation errors
  }

  // 3) Draw sections, compact & centered header with logo left
  let y = drawHeader(pdf, cfg, logoBase64, {
    companyName: companyInfo.companyName,
    address: companyInfo.address,
    phone: companyInfo.phone,
    email: companyInfo.email,
  });

  y = drawTitleBlock(pdf, cfg, data, y);

  y = drawTwoColumnInfo(
    pdf,
    cfg,
    "CONTRACT INFORMATION",
    [
      [
        { label: "Contract No:", value: data.contractNumber || "—" },
        { label: "Customer:", value: data.customerName || "—" },
      ],
      [
        { label: "Issue Date:", value: data.issueDate || "—" },
        { label: "Valid Until:", value: data.validUntil || "—" },
      ],
    ],
    y,
  );

  y = drawTwoColumnInfo(
    pdf,
    cfg,
    "PRODUCT INFORMATION",
    [
      [
        { label: "Product No:", value: data.productNumber || "—" },
        { label: "Product Name:", value: data.productName || "—" },
      ],
      [
        { label: "Brand:", value: data.productBrand || "—" },
        { label: "Location:", value: data.location || "—" },
      ],
    ],
    y,
  );

  y = drawTwoColumnInfo(
    pdf,
    cfg,
    "INSPECTION DETAILS",
    [
      [
        { label: "Inspection Date:", value: data.inspectionDate || "—" },
        { label: "Inspector:", value: data.engineerNames.join(", ") || "—" },
      ],
      [
        {
          label: "Total Items:",
          value: String(data.checklistResults.totalItems || 0),
        },
        {
          label: "Pass Rate:",
          value: `${Math.round(
            ((data.checklistResults.passedItems || 0) /
              Math.max(1, data.checklistResults.totalItems || 1)) *
              100,
          )}%`,
        },
      ],
    ],
    y,
  );

  y = drawChecklistTable(pdf, cfg, data, y);

  y = drawSignatures(pdf, cfg, data, inspectorQR, approverQR, y);

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
