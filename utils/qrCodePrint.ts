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
 * Generates simple styled QR code with company logo and header/footer
 * Creates clean square QR code with company branding
 * @param data - Data to encode in QR code
 * @param qrData - Product data for header/footer text
 * @returns Promise that resolves to base64 data URL
 */
async function generateStyledQRCode(
  data: string,
  qrData?: ProductQRData,
  size: number = 400,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const qrCode = new QRCodeStyling({
      width: size,
      height: size,
      type: "svg", // Use SVG for text overlay support
      data: data,
      image: "/images/logo/logo-light.png", // Company logo in QR center
      margin: Math.max(10, size * 0.0375), // Proportional margin (1.5% of size, min 10px)
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

    // Add simple header and footer text using SVG extension
    qrCode.applyExtension((svg) => {
      const svgWidth = size;
      const svgHeight = size;

      // Add company name header above QR code
      const headerText = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      headerText.setAttribute("x", String(svgWidth / 2));
      headerText.setAttribute("y", String(size * 0.03 + 8)); // Proportional header position
      headerText.setAttribute("text-anchor", "middle");
      headerText.setAttribute("font-family", "Arial, sans-serif");
      headerText.setAttribute("font-size", String(size * 0.04)); // 4% of size
      headerText.setAttribute("font-weight", "bold");
      headerText.setAttribute("fill", "#1e3a8a"); // Navy blue to match logo
      headerText.textContent = "PT Brilian Eka Saetama";
      svg.appendChild(headerText);

      // Add product info footer below QR code - single line with product number and name
      if (qrData) {
        const footerText = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text",
        );
        footerText.setAttribute("x", String(svgWidth / 2));
        footerText.setAttribute("y", String(svgHeight - (size * 0.005))); // Proportional footer position
        footerText.setAttribute("text-anchor", "middle");
        footerText.setAttribute("font-family", "Arial, sans-serif");
        footerText.setAttribute("font-size", String(size * 0.04)); // 4% of size, same as header
        footerText.setAttribute("font-weight", "bold");
        footerText.setAttribute("fill", "#1e3a8a"); // Navy blue to match logo

        // Combine product number and name in single line
        const productName =
          qrData.productName.length > 25
            ? qrData.productName.substring(0, 22) + "..."
            : qrData.productName;
        footerText.textContent = `${qrData.productNumber} - ${productName}`;
        svg.appendChild(footerText);
      }
    });

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
 * Generates a simple PDF containing QR code sticker for product
 * Creates minimal 10cm x 10cm sticker with branded QR code
 *
 * @param qrData - Product QR code data
 * @returns Promise that resolves to PDF blob
 */
export async function generateQRCodePDF(qrUrl: string, qrData: ProductQRData): Promise<Blob> {
  try {
    // Generate styled QR code with embedded company logo, header, footer, and border
    const qrCodeDataURL = await generateStyledQRCode(
      qrUrl,
      qrData,
    );

    // Create PDF document - EXACTLY 10cm x 10cm
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [100, 100], // 10cm x 10cm exactly
    });

    const pageSize = 100; // 10cm
    const qrSize = 95; // 9.5cm QR code (almost full page)

    // Simple white background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageSize, pageSize, "F");

    // Center the QR code
    const qrX = (pageSize - qrSize) / 2;
    const qrY = (pageSize - qrSize) / 2;

    // Add QR code with integrated header/footer via extension
    pdf.addImage(qrCodeDataURL, "PNG", qrX, qrY, qrSize, qrSize);

    // Return PDF as blob
    return pdf.output("blob");
  } catch (error) {
    console.error("Error generating QR code PDF:", error);
    throw new Error("Failed to generate QR code PDF. Please try again.");
  }
}

/**
 * Generates a styled QR code blob for bulk processing
 * Uses same styling as individual QR codes for consistency
 * @param qrUrl - URL string for QR code content  
 * @param qrData - ProductQRData object for labels and display
 * @param size - Optional size override for bulk generation (default: 400)
 * @returns Promise that resolves to PNG blob
 */
export async function generateBulkStyledQRCode(qrUrl: string, qrData: ProductQRData, size: number = 400): Promise<Blob> {
  try {
    // Generate styled QR code using URL content with ProductQRData for labels
    const qrCodeDataURL = await generateStyledQRCode(
      qrUrl,
      qrData,
      size
    );

    // Convert data URL to blob for bulk processing
    const response = await fetch(qrCodeDataURL);
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error("Error generating bulk styled QR code:", error);
    throw new Error("Failed to generate bulk styled QR code. Please try again.");
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
