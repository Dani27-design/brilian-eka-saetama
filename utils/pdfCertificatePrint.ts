import { CertificateData } from "./pdfCertificate";
import { generatePDFCertificate } from "./pdfCertificateGenerator";

/**
 * Configuration for browser print functionality
 */
export interface BrowserPrintConfig {
  windowTitle?: string;
  windowFeatures?: string;
  printDelay?: number;
}

/**
 * Default browser print configuration
 */
const DEFAULT_PRINT_CONFIG: BrowserPrintConfig = {
  windowTitle: "Certificate",
  windowFeatures: "width=800,height=600,scrollbars=yes,resizable=yes",
  printDelay: 500, // Delay before triggering print dialog
};

/**
 * Opens certificate PDF and triggers browser's native print dialog
 * Simple and direct approach using browser's built-in print functionality
 * 
 * @param certificateData - Complete certificate data
 * @param inspectorId - ID of the inspector for QR signature
 * @param approverId - ID of the approver for QR signature
 * @param config - Optional browser print configuration
 * 
 * @example
 * await openCertificateForPrint(certData, "inspector123", "approver456");
 * // Opens PDF in new window and shows browser print dialog
 */
export async function openCertificateForPrint(
  certificateData: CertificateData,
  inspectorId: string,
  approverId: string,
  config: Partial<BrowserPrintConfig> = {}
): Promise<void> {
  try {
    const printConfig = { ...DEFAULT_PRINT_CONFIG, ...config };
    
    // Generate PDF blob
    const pdfBlob = await generatePDFCertificate(certificateData, inspectorId, approverId);
    
    // Create object URL for the PDF
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Open PDF in new window
    const printWindow = window.open(pdfUrl, "_blank", printConfig.windowFeatures);
    
    if (!printWindow) {
      // Clean up and throw error instead of fallback to avoid double popups
      URL.revokeObjectURL(pdfUrl);
      throw new Error("Print popup was blocked. Please allow popups and try again.");
    }
    
    // Set window title
    if (printConfig.windowTitle) {
      printWindow.document.title = `${printConfig.windowTitle} - ${certificateData.certificateNumber}`;
    }
    
    // Focus on the new window
    printWindow.focus();
    
    // Let user control printing through browser's PDF viewer
    // Clean up object URL after window closes
    printWindow.addEventListener("beforeunload", () => {
      URL.revokeObjectURL(pdfUrl);
    });
    
  } catch (error) {
    console.error("Error opening certificate for print:", error);
    // Pass through the actual error with more context
    if (error instanceof Error) {
      throw new Error(`Certificate print failed: ${error.message}`);
    } else {
      throw new Error(`Certificate print failed: ${String(error)}`);
    }
  }
}

// Remove complex HTML creation function - not needed for simple browser print


/**
 * Creates a simple print dialog for the certificate
 * Alternative approach that opens PDF in current tab with print dialog
 * 
 * @param certificateData - Complete certificate data
 * @param inspectorId - ID of the inspector for QR signature
 * @param approverId - ID of the approver for QR signature
 * 
 * @example
 * await printCertificateInCurrentTab(certData, "inspector123", "approver456");
 */
export async function printCertificateInCurrentTab(
  certificateData: CertificateData,
  inspectorId: string,
  approverId: string
): Promise<void> {
  try {
    // Generate PDF blob
    const pdfBlob = await generatePDFCertificate(certificateData, inspectorId, approverId);
    
    // Create object URL
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Create temporary iframe for printing
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = pdfUrl;
    
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      iframe.contentWindow?.print();
      
      // Clean up after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(pdfUrl);
      }, 1000);
    };
    
  } catch (error) {
    console.error("Error printing certificate:", error);
    throw new Error("Failed to print certificate");
  }
}

/**
 * Checks if the browser supports print preview functionality
 * 
 * @returns Boolean indicating if print preview is supported
 */
export function isPrintPreviewSupported(): boolean {
  try {
    return typeof window !== "undefined" && 
           typeof window.open === "function" && 
           typeof URL.createObjectURL === "function";
  } catch {
    return false;
  }
}