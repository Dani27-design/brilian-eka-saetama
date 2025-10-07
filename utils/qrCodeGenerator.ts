import QRCode from "qrcode";
import { Product, ProductType } from "@/types/product";
import { DocumentReference } from "firebase/firestore";

/**
 * Represents the data structure encoded in product QR codes
 * Contains all essential information for mobile app identification
 */
export interface ProductQRData {
  productId: string;
  productNumber: string; // Keep as string for QR code display
  productName: string;
  productType: ProductType;
  brand: string;
  serialNumber?: string;
  contractId?: string;
  customerName?: string;
  maintenanceInterval: number;
  location?: string;
  generatedAt: string;
  version: string; // QR data format version for future compatibility
  publicUrl?: string; // URL for public certificate viewing
}

/**
 * Configuration options for QR code generation
 */
export interface QRCodeOptions {
  size: number;
  margin: number;
  color: {
    dark: string;
    light: string;
  };
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
}

/**
 * Default QR code generation options
 * Optimized for mobile scanning and printing clarity
 */
const DEFAULT_QR_OPTIONS: QRCodeOptions = {
  size: 256, // 256x256 pixels
  margin: 4,
  color: {
    dark: "#000000",
    light: "#FFFFFF",
  },
  errorCorrectionLevel: "M", // Medium error correction for good balance
};

/**
 * Generates universal QR URL for product
 * Creates a clean URL that works for both native cameras and mobile apps
 *
 * @param product - The product document data
 * @param productId - The Firestore document ID
 * @param contractId - Optional contract ID if product is assigned (legacy compatibility)
 * @param location - Optional location from contract details (legacy compatibility)
 * @param customerName - Optional customer name from contract (legacy compatibility)
 * @param baseUrl - Optional base URL override for the QR endpoint
 * @returns Universal QR URL string
 *
 * @example
 * const qrUrl = generateProductQRData(productData, "prod123");
 * // Returns: "https://brilian-eka-saetama.vercel.app/qr?pid=prod123"
 */
export function generateProductQRData(
  product: Product,
  productId: string,
  contractId?: string,
  location?: string,
  customerName?: string,
  baseUrl?: string,
): string {
  // Generate base URL for universal QR endpoint
  const domain = baseUrl || 
    process.env.NEXT_PUBLIC_APP_URL || 
    "https://brilian-eka-saetama.vercel.app";

  // Return clean URL for QR code content
  return `${domain}/qr?pid=${productId}`;
}

/**
 * Generates structured product data for internal use (labels, API responses, etc.)
 * This function maintains the original data structure for backward compatibility
 *
 * @param product - The product document data
 * @param productId - The Firestore document ID
 * @param contractId - Optional contract ID if product is assigned
 * @param location - Optional location from contract details
 * @param customerName - Optional customer name from contract
 * @param baseUrl - Optional base URL override for public certificate viewing
 * @returns Structured QR data object for internal use
 */
export function generateProductQRDataObject(
  product: Product,
  productId: string,
  contractId?: string,
  location?: string,
  customerName?: string,
  baseUrl?: string,
): ProductQRData {
  const productNumber = product.productNumber?.toString() || "0";

  // Generate public URL for certificate viewing using productId (globally unique)
  const publicUrl = baseUrl
    ? `${baseUrl}/product/${productId}/certificates`
    : `${
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://brilian-eka-saetama.vercel.app"
      }/product/${productId}/certificates`;

  return {
    productId,
    productNumber,
    productName: product.name || "Unknown Product",
    productType: product.productType,
    brand: product.specs?.brand || "N/A",
    serialNumber: product.specs?.serialNumber || undefined,
    contractId: contractId || undefined,
    customerName: customerName || undefined,
    maintenanceInterval: product.maintenanceInterval || 0,
    location: location || undefined,
    generatedAt: new Date().toISOString(),
    version: "1.0", // Version for future QR format changes
    publicUrl, // URL for public certificate viewing (uses productId for security)
  };
}

/**
 * Generates QR code as base64 data URL
 * Creates scannable QR code containing universal URL
 *
 * @param qrData - The URL string or ProductQRData object to encode in the QR code
 * @param options - Optional QR code generation options
 * @returns Promise resolving to base64 data URL
 *
 * @example
 * const qrUrl = generateProductQRData(product, productId);
 * const qrDataUrl = await generateQRCodeDataURL(qrUrl);
 * // Returns: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
 *
 * @example
 * // Custom options
 * const qrDataUrl = await generateQRCodeDataURL(qrUrl, {
 *   size: 512,
 *   color: { dark: "#000080", light: "#FFFFFF" }
 * });
 */
export async function generateQRCodeDataURL(
  qrData: string | ProductQRData,
  options: Partial<QRCodeOptions> = {},
): Promise<string> {
  try {
    const finalOptions = { ...DEFAULT_QR_OPTIONS, ...options };

    // Handle both URL strings and legacy ProductQRData objects
    let qrContent: string;
    if (typeof qrData === 'string') {
      // New format: URL string
      qrContent = qrData;
    } else {
      // Legacy format: JSON object (for backward compatibility)
      qrContent = JSON.stringify(qrData);
      // Validate data size for JSON format
      if (qrContent.length > 1000) {
        console.warn("QR data is quite large, may affect scanning reliability");
      }
    }

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(qrContent, {
      width: finalOptions.size,
      margin: finalOptions.margin,
      color: finalOptions.color,
      errorCorrectionLevel: finalOptions.errorCorrectionLevel,
    });

    return qrDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generates QR code as downloadable blob
 * Useful for direct file downloads
 *
 * @param qrData - The URL string or ProductQRData object to encode in the QR code
 * @param options - Optional QR code generation options
 * @returns Promise resolving to Blob object
 *
 * @example
 * const qrUrl = generateProductQRData(product, productId);
 * const blob = await generateQRCodeBlob(qrUrl);
 * const url = URL.createObjectURL(blob);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = `QR_${productNumber}.png`;
 * a.click();
 */
export async function generateQRCodeBlob(
  qrData: string | ProductQRData,
  options: Partial<QRCodeOptions> = {},
): Promise<Blob> {
  try {
    const dataUrl = await generateQRCodeDataURL(qrData, options);

    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    return blob;
  } catch (error) {
    console.error("Error generating QR code blob:", error);
    throw new Error("Failed to generate QR code blob");
  }
}

/**
 * Triggers download of QR code as PNG file
 * Automatically starts download with formatted filename
 *
 * @param qrData - The URL string or ProductQRData object to encode in the QR code
 * @param options - Optional QR code generation options
 * @param filename - Optional custom filename (without extension)
 * @returns Promise that resolves when download is initiated
 *
 * @example
 * // URL format (new)
 * const qrUrl = generateProductQRData(product, productId);
 * await downloadQRCode(qrUrl, {}, "product_PRD001");
 * // Downloads file named "product_PRD001.png"
 *
 * @example
 * // Legacy ProductQRData format
 * const qrDataObj = generateProductQRDataObject(product, productId);
 * await downloadQRCode(qrDataObj);
 * // Downloads file named "QR_PRD-001_Fire_Extinguisher.png"
 */
export async function downloadQRCode(
  qrData: string | ProductQRData,
  options: Partial<QRCodeOptions> = {},
  filename?: string,
): Promise<void> {
  try {
    const blob = await generateQRCodeBlob(qrData, options);

    // Create download URL
    const url = URL.createObjectURL(blob);

    // Generate filename
    let downloadFilename: string;
    if (filename) {
      // Use custom filename
      downloadFilename = `${filename}.png`;
    } else if (typeof qrData === 'string') {
      // URL format: use timestamp
      downloadFilename = `QR_${new Date().toISOString().split('T')[0]}_${Date.now()}.png`;
    } else {
      // Legacy ProductQRData format: use product info
      const sanitizedProductNumber = qrData.productNumber.replace(
        /[^a-zA-Z0-9]/g,
        "_",
      );
      const sanitizedProductName = qrData.productName
        .replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 20); // Limit length
      downloadFilename = `QR_${sanitizedProductNumber}_${sanitizedProductName}.png`;
    }

    // Create temporary link element and trigger download
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = downloadFilename;
    downloadLink.style.display = "none";

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Clean up the blob URL
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading QR code:", error);
    throw new Error("Failed to download QR code");
  }
}

/**
 * Parses QR code data from scanned JSON string
 * Used by mobile apps to extract product information
 *
 * @param qrString - The JSON string scanned from QR code
 * @returns Parsed ProductQRData object
 * @throws Error if QR string is invalid or malformed
 *
 * @example
 * const scannedData = "{'productId':'123','productNumber':'PRD-001',...}";
 * const productData = parseQRCodeData(scannedData);
 * console.log(productData.productName); // "Fire Extinguisher 3kg"
 */
export function parseQRCodeData(qrString: string): ProductQRData {
  try {
    const parsed = JSON.parse(qrString) as ProductQRData;

    // Validate required fields
    if (!parsed.productId || !parsed.productNumber || !parsed.productType) {
      throw new Error("Invalid QR code: missing required fields");
    }

    // Validate version compatibility
    if (parsed.version && parsed.version !== "1.0") {
      console.warn(
        `QR code version ${parsed.version} may not be fully supported`,
      );
    }

    return parsed;
  } catch (error) {
    console.error("Error parsing QR code data:", error);
    throw new Error("Invalid QR code format");
  }
}

/**
 * Validates if a string contains valid product QR data
 * Quick check without throwing errors
 *
 * @param qrString - The string to validate
 * @returns True if string contains valid QR data
 *
 * @example
 * if (isValidProductQR(scannedString)) {
 *   const productData = parseQRCodeData(scannedString);
 *   // Process product data
 * }
 */
export function isValidProductQR(qrString: string): boolean {
  try {
    parseQRCodeData(qrString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates a formatted label for the QR code
 * Creates printable text to accompany the QR code
 *
 * @param qrData - The QR data to create label for
 * @returns Formatted label string
 *
 * @example
 * const label = generateQRLabel(qrData);
 * // Returns:
 * // "PRD-001 | Fire Extinguisher 3kg
 * //  APAR | ABC Fire | Building A
 * //  Maintenance: 30 days"
 */
export function generateQRLabel(qrData: ProductQRData): string {
  const lines: string[] = [];

  // Line 1: Product number and name
  lines.push(`${qrData.productNumber} | ${qrData.productName}`);

  // Line 2: Type, brand, and location
  const line2Parts: string[] = [];
  line2Parts.push(qrData.productType);
  if (qrData.brand && qrData.brand !== "N/A") {
    line2Parts.push(qrData.brand);
  }
  if (qrData.location) {
    line2Parts.push(qrData.location);
  }
  lines.push(line2Parts.join(" | "));

  // Line 3: Maintenance interval
  if (qrData.maintenanceInterval > 0) {
    lines.push(`Maintenance: ${qrData.maintenanceInterval} days`);
  }

  return lines.join("\n");
}

/**
 * Gets appropriate QR code size based on intended use
 * Provides recommended sizes for different applications
 *
 * @param usage - The intended usage of the QR code
 * @returns Recommended pixel size
 *
 * @example
 * const size = getQRCodeSize("print"); // 512
 * const qrCode = await generateQRCodeDataURL(data, { size });
 */
export function getQRCodeSize(
  usage: "mobile" | "print" | "web" | "large_print",
): number {
  switch (usage) {
    case "mobile":
      return 200; // Good for mobile screens
    case "web":
      return 256; // Standard web display
    case "print":
      return 512; // High quality for standard printing
    case "large_print":
      return 1024; // Very high quality for large format printing
    default:
      return 256;
  }
}
