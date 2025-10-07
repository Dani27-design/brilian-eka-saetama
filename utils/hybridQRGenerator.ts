import { Product, ProductType } from "@/types/product";
import { ProductQRData } from "./qrCodeGenerator";

/**
 * Hybrid QR code generation that works for both native cameras and mobile app
 *
 * Generates URLs with encoded product data that work for:
 * 1. Native phone cameras → Opens URL → Public certificate page
 * 2. Mobile engineer app → Parses URL → Extracts product data
 */

/**
 * URL-based QR data structure for hybrid compatibility
 */
export interface HybridQRData {
  url: string; // Main URL for native cameras
  productData: ProductQRData; // Embedded product data for mobile app
}

/**
 * Generates a hybrid QR code URL that works for both native cameras and mobile app
 *
 * The URL format: https://domain.com/product/{productNumber}/certificates?data={encodedProductData}
 *
 * @param product - The product document data
 * @param productId - The Firestore document ID
 * @param contractId - Optional contract ID if product is assigned
 * @param location - Optional location from contract details
 * @param customerName - Optional customer name from contract
 * @param baseUrl - Optional base URL override
 * @returns URL string that contains both navigation and data
 */
export function generateHybridQRURL(
  product: Product,
  productId: string,
  contractId?: string,
  location?: string,
  customerName?: string,
  baseUrl?: string,
): string {
  const productNumber = product.productNumber?.toString() || "0";

  // Generate base URL for certificate viewing using productId (globally unique)
  const certificateBaseUrl = baseUrl
    ? `${baseUrl}/product/${productId}/certificates`
    : `${
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://brilian-eka-saetama.vercel.app"
      }/product/${productId}/certificates`;

  // Create product data object
  const productData: ProductQRData = {
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
    version: "1.0",
    publicUrl: certificateBaseUrl,
  };

  // Encode product data as base64 for URL safety
  const encodedData = Buffer.from(JSON.stringify(productData)).toString(
    "base64",
  );

  // Combine URL with encoded data as query parameter
  const hybridUrl = `${certificateBaseUrl}?data=${encodedData}`;

  return hybridUrl;
}

/**
 * Extracts product data from hybrid QR URL
 * Used by mobile app to get product information from scanned URL
 *
 * @param qrUrl - The scanned URL from QR code
 * @returns ProductQRData object or null if invalid
 */
export function parseHybridQRURL(qrUrl: string): ProductQRData | null {
  try {
    const url = new URL(qrUrl);

    // Check if it's a product certificate URL (now using productId)
    const pathMatch = url.pathname.match(/\/product\/([^\/]+)\/certificates/);
    if (!pathMatch) {
      return null;
    }

    const productIdFromUrl = pathMatch[1];

    // Try to extract embedded data first
    const dataParam = url.searchParams.get("data");
    if (dataParam) {
      try {
        const decodedData = Buffer.from(dataParam, "base64").toString("utf-8");
        const productData = JSON.parse(decodedData) as ProductQRData;

        // Validate the data
        if (
          productData.productId &&
          productData.productNumber &&
          productData.productType
        ) {
          return productData;
        }
      } catch (decodeError) {
        console.warn("Failed to decode embedded data:", decodeError);
      }
    }

    // Fallback: create minimal data from URL
    return {
      productId: productIdFromUrl,
      productNumber: "0", // Can't determine from URL alone
      productName: "Unknown Product",
      productType: "APAR" as ProductType, // Default type
      brand: "N/A",
      maintenanceInterval: 0,
      generatedAt: new Date().toISOString(),
      version: "1.0",
      publicUrl: qrUrl,
    };
  } catch (error) {
    console.error("Error parsing hybrid QR URL:", error);
    return null;
  }
}

/**
 * Validates if a string is a hybrid QR URL
 *
 * @param qrString - The string to validate
 * @returns true if it's a valid product certificate URL
 */
export function isValidHybridQRURL(qrString: string): boolean {
  try {
    const url = new URL(qrString);
    return (
      url.pathname.includes("/product/") &&
      url.pathname.includes("/certificates")
    );
  } catch {
    return false;
  }
}

/**
 * Creates a hybrid QR data object for generation
 *
 * @param product - The product document data
 * @param productId - The Firestore document ID
 * @param contractId - Optional contract ID
 * @param location - Optional location
 * @param customerName - Optional customer name
 * @param baseUrl - Optional base URL override
 * @returns HybridQRData object ready for QR generation
 */
export function createHybridQRData(
  product: Product,
  productId: string,
  contractId?: string,
  location?: string,
  customerName?: string,
  baseUrl?: string,
): HybridQRData {
  const productNumber = product.productNumber?.toString() || "0";

  const productData: ProductQRData = {
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
    version: "1.0",
  };

  const url = generateHybridQRURL(
    product,
    productId,
    contractId,
    location,
    customerName,
    baseUrl,
  );

  return {
    url,
    productData,
  };
}
