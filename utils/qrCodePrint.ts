"use client";

import { ProductQRData, generateProductQRData } from "./qrCodeGenerator";
import QRCodeStyling from "qr-code-styling";
import jsPDF from "jspdf";

/**
 * Configuration for QR code print functionality
 */
export interface QRCodePrintConfig {
  windowTitle?: string;
  windowFeatures?: string;
  printDelay?: number;
  qrSize?: string; // CSS size for QR code (default: 10cm)
}

/**
 * Default QR code print configuration
 */
const DEFAULT_QR_PRINT_CONFIG: QRCodePrintConfig = {
  windowTitle: "QR Code",
  windowFeatures: "width=800,height=600,scrollbars=yes,resizable=yes",
  printDelay: 800, // Delay before triggering print dialog
  qrSize: "10cm", // 10cm x 10cm as requested
};

/**
 * Generates clean QR code with company logo only (no text)
 * Creates simple QR code for PDF layout system
 * @param data - Data to encode in QR code
 * @returns Promise that resolves to base64 data URL
 */
async function generateCleanQRCode(
  data: string,
  size: number = 400,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const qrCode = new QRCodeStyling({
      width: size,
      height: size,
      type: "svg",
      data: data,
      image: "/images/logo/logo-light.png", // Company logo in QR center
      margin: 20, // Fixed margin for clean appearance
      qrOptions: {
        typeNumber: 0,
        mode: "Byte",
        errorCorrectionLevel: "H", // High error correction for logo integration
      },
      imageOptions: {
        hideBackgroundDots: true, // Hide dots behind logo
        imageSize: 0.3, // Logo size for good balance
        margin: 4, // Small margin around logo
        crossOrigin: "anonymous",
      },
      dotsOptions: {
        color: "#1e3a8a", // Navy blue to match company logo
        type: "rounded",
      },
      backgroundOptions: {
        color: "#ffffff",
      },
      cornersSquareOptions: {
        color: "#0f172a", // Darker navy for corners
        type: "extra-rounded",
      },
      cornersDotOptions: {
        color: "#059669", // Teal accent to match logo
        type: "dot",
      },
    });

    // No text extensions - clean QR code only

    // Convert SVG to PNG data URL
    setTimeout(() => {
      qrCode
        .getRawData("png")
        .then((data: any) => {
          if (data) {
            // Handle both Blob and Buffer types
            let blob: Blob;
            if (data instanceof Blob) {
              blob = data;
            } else {
              // Convert Buffer to Blob
              blob = new Blob([data], { type: "image/png" });
            }

            const reader = new FileReader();
            reader.onload = () => {
              resolve(reader.result as string);
            };
            reader.onerror = () => {
              reject(new Error("Failed to convert QR code to data URL"));
            };
            reader.readAsDataURL(blob);
          } else {
            reject(new Error("Failed to generate QR code data"));
          }
        })
        .catch((error) => {
          reject(new Error(`QR code generation failed: ${error.message}`));
        });
    }, 100); // Small delay to ensure extension is applied
  });
}

/**
 * Generates a professional PDF containing QR code sticker for product
 * Creates properly formatted 10cm x 10cm sticker with company branding
 *
 * @param qrData - Product QR code data
 * @returns Promise that resolves to PDF blob
 */
export async function generateQRCodePDF(qrUrl: string, qrData: ProductQRData): Promise<Blob> {
  try {
    // Generate clean QR code without any text
    const qrCodeDataURL = await generateCleanQRCode(qrUrl, 500);

    // Create PDF document - EXACTLY 10cm x 10cm
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [100, 100], // 10cm x 10cm exactly
    });

    const pageSize = 100; // 10cm
    
    // Optimized layout with minimal spacing for maximum content
    const headerY = 6; // Company name 6mm from top (reduced from 8mm)
    const qrSize = 80; // 80mm QR code
    const qrX = (pageSize - qrSize) / 2; // Center horizontally
    const qrY = 8; // QR starts 8mm from top (reduced from 10mm)
    const footerStartY = qrY + qrSize + 1; // Footer starts 1mm after QR (reduced from 2mm)


    // Simple white background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageSize, pageSize, "F");

    // Add company name header - smaller font for space saving
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10); // Reduced from 12pt to 10pt
    pdf.setTextColor(30, 58, 138); // Navy blue
    pdf.text("PT Brilian Eka Saetama", pageSize / 2, headerY, { align: "center" });

    // Position and add clean QR code
    pdf.addImage(qrCodeDataURL, "PNG", qrX, qrY, qrSize, qrSize);

    // Add product information footer - smaller font for space saving
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9); // Reduced from 11pt to 9pt
    pdf.setTextColor(30, 58, 138); // Navy blue - same color as company name
    
    const productName = qrData.productName.length > 30 
      ? qrData.productName.substring(0, 27) + "..." 
      : qrData.productName;
    pdf.text(`${qrData.productNumber} - ${productName}`, pageSize / 2, footerStartY, { align: "center" });

    // Contract name (if available) - bigger font with bold styling
    if (qrData.contractName && qrData.contractName !== "N/A" && qrData.contractName.trim() !== "") {
      pdf.setFont("helvetica", "bold"); // Changed to bold
      pdf.setFontSize(8); // Increased from 7pt to 8pt for better readability
      pdf.setTextColor(30, 58, 138); // Same navy blue color as product name
      
      // Split contract name into lines for wrapping
      const maxWidth = pageSize - 8; // Leave 4mm margin on each side (reduced from 5mm)
      const contractLines = pdf.splitTextToSize(qrData.contractName, maxWidth);
      
      // Add each line of contract name with vertical gap above
      contractLines.forEach((line: string, index: number) => {
        pdf.text(line, pageSize / 2, footerStartY + 5 + (index * 3), { align: "center" }); // Added 2mm gap (changed from +3 to +5)
      });
    }

    // Return PDF as blob
    return pdf.output("blob");
  } catch (error) {
    console.error("Error generating QR code PDF:", error);
    throw new Error("Failed to generate QR code PDF. Please try again.");
  }
}

/**
 * Generates a complete PDF QR sticker for bulk processing
 * Uses same PDF generation as individual QR codes for consistency
 * @param qrUrl - URL string for QR code content  
 * @param qrData - ProductQRData object for labels and display
 * @param size - Optional size override (not used in PDF generation)
 * @returns Promise that resolves to PDF blob
 */
export async function generateBulkStyledQRCode(qrUrl: string, qrData: ProductQRData, size: number = 400): Promise<Blob> {
  try {
    // Generate complete PDF sticker using the same system as individual QR generation
    const pdfBlob = await generateQRCodePDF(qrUrl, qrData);
    return pdfBlob;
  } catch (error) {
    console.error("Error generating bulk styled QR code PDF:", error);
    throw new Error("Failed to generate bulk styled QR code PDF. Please try again.");
  }
}

/**
 * Opens QR code PDF in new window for printing
 * Exactly matches the inspection certificate workflow
 *
 * @param qrData - Product QR code data
 * @param windowTitle - Optional title for the print window
 *
 * @example
 * await printQRCode(qrData, "QR Sticker - PRD001");
 * // Opens PDF in new window like certificates
 */
export async function printQRCode(
  qrData: ProductQRData,
  windowTitle?: string,
): Promise<void> {
  try {
    // Generate QR URL for the QR code content
    // For printing, we need to create a temporary URL since we have ProductQRData
    const qrUrl = generateProductQRData(
      { 
        productNumber: parseInt(qrData.productNumber),
        name: qrData.productName,
        productType: qrData.productType,
        specs: { brand: qrData.brand, serialNumber: qrData.serialNumber },
        maintenanceInterval: qrData.maintenanceInterval
      } as any, 
      qrData.productId
    );
    
    // Generate PDF blob (same pattern as certificates)
    const pdfBlob = await generateQRCodePDF(qrUrl, qrData);

    // Create object URL for the PDF (same as certificates)
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Open PDF in new window (exactly like certificates)
    const printWindow = window.open(
      pdfUrl,
      "_blank",
      "width=800,height=600,scrollbars=yes,resizable=yes",
    );

    if (!printWindow) {
      // Clean up and throw error (same as certificates)
      URL.revokeObjectURL(pdfUrl);
      throw new Error(
        "Print popup was blocked. Please allow popups and try again.",
      );
    }

    // Set window title (same as certificates)
    if (windowTitle) {
      printWindow.document.title = `${windowTitle} - ${qrData.productNumber}`;
    }

    // Focus on the new window (same as certificates)
    printWindow.focus();

    // Clean up object URL when window closes (same as certificates)
    printWindow.addEventListener("beforeunload", () => {
      URL.revokeObjectURL(pdfUrl);
    });
  } catch (error) {
    console.error("Error opening QR print window:", error);
    // Pass through actual error (same as certificates)
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`QR code print failed: ${String(error)}`);
    }
  }
}
