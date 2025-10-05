import QRCode from "qrcode";
import { formatToWIB } from "./dateFormatter";

/**
 * Data structure for inspection digital signatures
 * Contains all necessary information for signature verification
 */
export interface InspectionSignatureData {
  type: "inspection_signature";
  certNumber: string;
  signer: {
    id: string;
    name: string;
    role: "inspector" | "approver";
  };
  signedAt: string; // ISO timestamp
  inspectionId: string;
  inspectionDate: string;
  productNumber: string;
  contractNumber: string;
}

/**
 * Configuration options for QR code signature generation
 */
export interface QRSignatureOptions {
  size: number;
  margin: number;
  color: {
    dark: string;
    light: string;
  };
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
}

/**
 * Default QR code signature options
 * Optimized for signature verification and scanning reliability
 */
const DEFAULT_QR_SIGNATURE_OPTIONS: QRSignatureOptions = {
  size: 100, // 100x100 pixels for compact certificate layout
  margin: 2,
  color: {
    dark: "#000000",
    light: "#FFFFFF",
  },
  errorCorrectionLevel: "H", // High error correction for signatures
};

/**
 * Creates QR code signature data for inspector
 * 
 * @param inspectorId - ID of the inspector who performed the inspection
 * @param inspectorName - Name of the inspector
 * @param certificateNumber - Certificate number for verification
 * @param inspectionId - Maintenance/inspection record ID
 * @param inspectionDate - Date when inspection was performed
 * @param productNumber - Product being inspected
 * @param contractNumber - Contract associated with the inspection
 * @returns Signature data ready for QR generation
 */
export function createInspectorSignatureData(
  inspectorId: string,
  inspectorName: string,
  certificateNumber: string,
  inspectionId: string,
  inspectionDate: string,
  productNumber: string,
  contractNumber: string
): InspectionSignatureData {
  return {
    type: "inspection_signature",
    certNumber: certificateNumber,
    signer: {
      id: inspectorId,
      name: inspectorName,
      role: "inspector",
    },
    signedAt: formatToWIB(new Date()),
    inspectionId,
    inspectionDate,
    productNumber,
    contractNumber,
  };
}

/**
 * Creates QR code signature data for approver
 * 
 * @param approverId - ID of the user who approved the inspection
 * @param approverName - Name of the approver
 * @param certificateNumber - Certificate number for verification
 * @param inspectionId - Maintenance/inspection record ID
 * @param inspectionDate - Date when inspection was performed
 * @param productNumber - Product being inspected
 * @param contractNumber - Contract associated with the inspection
 * @returns Signature data ready for QR generation
 */
export function createApproverSignatureData(
  approverId: string,
  approverName: string,
  certificateNumber: string,
  inspectionId: string,
  inspectionDate: string,
  productNumber: string,
  contractNumber: string
): InspectionSignatureData {
  return {
    type: "inspection_signature",
    certNumber: certificateNumber,
    signer: {
      id: approverId,
      name: approverName,
      role: "approver",
    },
    signedAt: formatToWIB(new Date()),
    inspectionId,
    inspectionDate,
    productNumber,
    contractNumber,
  };
}

/**
 * Generates QR code data URL from signature data
 * Creates base64 data URL that can be embedded in PDF
 * 
 * @param signatureData - Complete signature data structure
 * @param options - Optional QR code generation options
 * @returns Promise that resolves to base64 data URL
 * 
 * @example
 * const inspectorQR = await generateQRCodeDataURL(inspectorSignatureData);
 * // Returns: "data:image/png;base64,iVBORw0KGgoAAAA..."
 */
export async function generateQRCodeDataURL(
  signatureData: InspectionSignatureData,
  options: Partial<QRSignatureOptions> = {}
): Promise<string> {
  try {
    const qrOptions = { ...DEFAULT_QR_SIGNATURE_OPTIONS, ...options };
    
    // Convert signature data to JSON string for QR encoding
    const qrDataString = JSON.stringify(signatureData);
    
    // Generate QR code as data URL
    const qrDataURL = await QRCode.toDataURL(qrDataString, {
      width: qrOptions.size,
      margin: qrOptions.margin,
      color: qrOptions.color,
      errorCorrectionLevel: qrOptions.errorCorrectionLevel,
    });
    
    return qrDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code for signature");
  }
}

/**
 * Validates signature data structure
 * Ensures all required fields are present and properly formatted
 * 
 * @param signatureData - Signature data to validate
 * @returns Validation result with success status and error messages
 */
export function validateSignatureData(signatureData: InspectionSignatureData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check required fields
  if (!signatureData.type || signatureData.type !== "inspection_signature") {
    errors.push("Invalid signature type");
  }
  
  if (!signatureData.certNumber) {
    errors.push("Certificate number is required");
  }
  
  if (!signatureData.signer?.id) {
    errors.push("Signer ID is required");
  }
  
  if (!signatureData.signer?.name) {
    errors.push("Signer name is required");
  }
  
  if (!signatureData.signer?.role || !["inspector", "approver"].includes(signatureData.signer.role)) {
    errors.push("Valid signer role is required (inspector or approver)");
  }
  
  if (!signatureData.signedAt) {
    errors.push("Signature timestamp is required");
  }
  
  if (!signatureData.inspectionId) {
    errors.push("Inspection ID is required");
  }
  
  if (!signatureData.inspectionDate) {
    errors.push("Inspection date is required");
  }
  
  if (!signatureData.productNumber) {
    errors.push("Product number is required");
  }
  
  if (!signatureData.contractNumber) {
    errors.push("Contract number is required");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Parses QR code data to extract signature information
 * Used for signature verification when QR codes are scanned
 * 
 * @param qrDataString - Raw QR code data string
 * @returns Parsed signature data or null if invalid
 * 
 * @example
 * const scannedData = "{"type":"inspection_signature",...}";
 * const signatureData = parseQRSignatureData(scannedData);
 * if (signatureData) {
 *   console.log(`Signed by: ${signatureData.signer.name}`);
 * }
 */
export function parseQRSignatureData(qrDataString: string): InspectionSignatureData | null {
  try {
    const parsedData = JSON.parse(qrDataString) as InspectionSignatureData;
    
    // Validate the parsed data
    const validation = validateSignatureData(parsedData);
    if (!validation.isValid) {
      console.warn("Invalid signature data:", validation.errors);
      return null;
    }
    
    return parsedData;
  } catch (error) {
    console.error("Error parsing QR signature data:", error);
    return null;
  }
}

/**
 * Generates both inspector and approver QR codes for a certificate
 * Convenience function for creating both signature QR codes at once
 * 
 * @param inspectorId - ID of the inspector
 * @param inspectorName - Name of the inspector
 * @param approverId - ID of the approver
 * @param approverName - Name of the approver
 * @param certificateNumber - Certificate number
 * @param inspectionId - Inspection record ID
 * @param inspectionDate - Inspection date
 * @param productNumber - Product number
 * @param contractNumber - Contract number
 * @returns Promise with both QR code data URLs
 */
export async function generateBothSignatureQRCodes(
  inspectorId: string,
  inspectorName: string,
  approverId: string,
  approverName: string,
  certificateNumber: string,
  inspectionId: string,
  inspectionDate: string,
  productNumber: string,
  contractNumber: string
): Promise<{
  inspectorQR: string;
  approverQR: string;
}> {
  try {
    // Create signature data for both parties
    const inspectorSignatureData = createInspectorSignatureData(
      inspectorId,
      inspectorName,
      certificateNumber,
      inspectionId,
      inspectionDate,
      productNumber,
      contractNumber
    );
    
    const approverSignatureData = createApproverSignatureData(
      approverId,
      approverName,
      certificateNumber,
      inspectionId,
      inspectionDate,
      productNumber,
      contractNumber
    );
    
    // Generate QR codes for both signatures
    const [inspectorQR, approverQR] = await Promise.all([
      generateQRCodeDataURL(inspectorSignatureData),
      generateQRCodeDataURL(approverSignatureData),
    ]);
    
    return {
      inspectorQR,
      approverQR,
    };
  } catch (error) {
    console.error("Error generating signature QR codes:", error);
    throw new Error("Failed to generate signature QR codes");
  }
}