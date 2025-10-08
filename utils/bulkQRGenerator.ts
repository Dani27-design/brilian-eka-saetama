import JSZip from 'jszip';
import { Product } from '@/types/product';
import { 
  generateProductQRData, 
  generateProductQRDataObject,
  generateQRCodeDataURL, 
  getQRCodeSize,
  generateQRLabel 
} from './qrCodeGenerator';
import { 
  generateDesignedQRBlob, 
  getQRDesignOptions 
} from './qrCodeDesigner';
import { generateBulkStyledQRCode } from './qrCodePrint';
import { findProductLocation } from './findProductLocation';
import { firestore } from '@/db/firebase/firebaseConfig';
import { doc } from 'firebase/firestore';

/**
 * Configuration options for bulk QR generation
 */
export interface BulkQRConfig {
  size: 'mobile' | 'print' | 'web' | 'large_print';
  includeLabels: boolean;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  format: 'png' | 'jpg' | 'pdf';
  useDesignedQR: boolean;
  useStyledQR: boolean; // New option for current company styling
  logoUrl?: string;
  baseUrl?: string; // Base URL for public certificate viewing
}

/**
 * Progress callback for bulk QR generation
 */
export type BulkQRProgressCallback = (progress: {
  current: number;
  total: number;
  productName: string;
  status: 'generating' | 'complete' | 'error';
}) => void;

/**
 * Result of bulk QR generation operation
 */
export interface BulkQRResult {
  success: number;
  failed: number;
  zipBlob?: Blob;
  errors: Array<{
    productId: string;
    productName: string;
    error: string;
  }>;
}

/**
 * Generates QR codes for multiple products and packages them in a ZIP file
 * @param products - Array of products to generate QR codes for
 * @param config - QR generation configuration
 * @param onProgress - Optional progress callback
 * @returns Promise resolving to bulk QR generation result
 */
export async function generateBulkQRCodes(
  products: (Product & { contractData?: any })[],
  config: BulkQRConfig = {
    size: 'print',
    includeLabels: true,
    errorCorrectionLevel: 'H',
    format: 'png',
    useDesignedQR: true,
    useStyledQR: true, // Default to new styled QR codes
    logoUrl: '/images/logo/logo-light.png'
  },
  onProgress?: BulkQRProgressCallback
): Promise<BulkQRResult> {
  const result: BulkQRResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  if (products.length === 0) {
    throw new Error('No products provided for QR generation');
  }

  try {
    const zip = new JSZip();
    const qrSize = getQRCodeSize(config.size);

    // No folders needed - just place files in root of ZIP for simplicity

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        // Update progress
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: products.length,
            productName: product.name,
            status: 'generating'
          });
        }

        if (!product.id) {
          throw new Error('Product ID is required');
        }

        // Get location and customer name from contract if available
        let location: string | undefined;
        let customerName: string | undefined;
        if (product.contractData?.productDetails) {
          location = findProductLocation(
            doc(firestore, "products", product.id),
            product.contractData.productDetails
          );
          if (location === "N/A") location = undefined;
        }
        if (product.contractData?.customerData?.name) {
          customerName = product.contractData.customerData.name;
        }

        // Generate QR URL for QR code content
        const qrUrl = generateProductQRData(
          product,
          product.id,
          product.contractData?.id,
          location,
          customerName,
          config.baseUrl
        );

        // Generate QR data object for labels and filename generation
        const qrDataObject = generateProductQRDataObject(
          product,
          product.id,
          product.contractData?.id,
          location,
          customerName,
          product.contractData?.contractName,
          config.baseUrl
        );

        // Generate QR code image
        let qrBlob: Blob;
        if (config.useStyledQR) {
          // Use current company styled QR code (recommended)
          qrBlob = await generateBulkStyledQRCode(qrUrl, qrDataObject, qrSize);
        } else if (config.useDesignedQR) {
          // Use legacy designed QR code with logo and styling
          const designOptions = getQRDesignOptions(config.size);
          qrBlob = await generateDesignedQRBlob(
            qrDataObject,
            config.logoUrl,
            designOptions
          );
        } else {
          // Use traditional QR code with URL content
          const qrDataUrl = await generateQRCodeDataURL(qrUrl, {
            size: qrSize,
            errorCorrectionLevel: config.errorCorrectionLevel
          });
          qrBlob = await dataURLToBlob(qrDataUrl);
        }
        
        // Create safe filename using productId for uniqueness
        const safeProductId = product.id.replace(/[^a-zA-Z0-9]/g, '_');
        const safeProductNumber = product.productNumber.toString().replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${safeProductId}_${safeProductNumber}`;

        // Add QR file directly to ZIP root (no folders)
        zip.file(`${filename}.${config.format}`, qrBlob);

        result.success++;

        // Update progress
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: products.length,
            productName: product.name,
            status: 'complete'
          });
        }

      } catch (error: any) {
        console.error(`Error generating QR for product ${product.id}:`, error);
        
        result.errors.push({
          productId: product.id || 'unknown',
          productName: product.name,
          error: error.message || 'Unknown error'
        });
        
        result.failed++;

        // Update progress with error
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: products.length,
            productName: product.name,
            status: 'error'
          });
        }
      }
    }

    // Generate ZIP blob (no summary file needed)
    result.zipBlob = await zip.generateAsync({ type: 'blob' });

  } catch (error: any) {
    console.error('Bulk QR generation failed:', error);
    throw new Error(`Bulk QR generation failed: ${error.message}`);
  }

  return result;
}

/**
 * Downloads the bulk QR ZIP file
 * @param zipBlob - ZIP file blob
 * @param filename - Optional filename for download
 */
export function downloadBulkQRZip(
  zipBlob: Blob, 
  filename: string = `product-qr-codes-${new Date().toISOString().split('T')[0]}.zip`
) {
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Generates a summary text for the bulk QR operation
 * @param result - Bulk QR generation result
 * @param totalProducts - Total number of products processed
 * @param config - QR generation configuration
 * @returns Formatted summary string
 */
function generateBulkQRSummary(
  result: BulkQRResult, 
  totalProducts: number, 
  config: BulkQRConfig
): string {
  const lines = [
    'Product QR Codes Generation Summary',
    '====================================',
    '',
    `Generated on: ${new Date().toLocaleString()}`,
    `Total products: ${totalProducts}`,
    `Successfully generated: ${result.success}`,
    `Failed: ${result.failed}`,
    '',
    'Configuration:',
    `- Size: ${config.size}`,
    `- Error correction: ${config.errorCorrectionLevel}`,
    `- Format: ${config.format}`,
    `- Styled QR: ${config.useStyledQR ? 'Yes' : 'No'}`,
    `- Legacy Designed QR: ${config.useDesignedQR ? 'Yes' : 'No'}`,
    `- Labels included: ${config.includeLabels ? 'Yes' : 'No'}`,
    '',
    'Contents:',
    '- qr-codes/: QR code images for each product',
  ];

  if (config.includeLabels) {
    lines.push('- labels/: Text labels with product information');
  }

  if (result.errors.length > 0) {
    lines.push('', 'Errors:');
    result.errors.forEach(error => {
      lines.push(`- ${error.productName} (${error.productId}): ${error.error}`);
    });
  }

  lines.push('', 'Instructions:');
  lines.push('1. Extract all files from this ZIP archive');
  lines.push('2. Print QR codes at high quality (300 DPI recommended)');
  lines.push('3. Test QR codes with a mobile scanner before deployment');
  lines.push('4. Each QR code contains complete product information');

  return lines.join('\n');
}

/**
 * Converts data URL to Blob object
 * @param dataURL - Data URL string
 * @returns Promise resolving to Blob
 */
async function dataURLToBlob(dataURL: string): Promise<Blob> {
  const response = await fetch(dataURL);
  return response.blob();
}

/**
 * Estimates the total size and time for bulk QR generation
 * @param productCount - Number of products
 * @param config - QR generation configuration
 * @returns Estimation object
 */
export function estimateBulkQRGeneration(
  productCount: number,
  config: BulkQRConfig
): {
  estimatedSizeMB: number;
  estimatedTimeSeconds: number;
  recommendedBatchSize: number;
} {
  const qrSize = getQRCodeSize(config.size);
  const bytesPerQR = (qrSize * qrSize * 4) / 8; // Rough estimate
  const totalBytes = bytesPerQR * productCount;
  const estimatedSizeMB = totalBytes / (1024 * 1024);
  
  // Rough time estimate: ~200ms per QR code
  const estimatedTimeSeconds = (productCount * 0.2);
  
  // Recommend batch processing for large sets
  const recommendedBatchSize = productCount > 100 ? 50 : productCount;
  
  return {
    estimatedSizeMB,
    estimatedTimeSeconds,
    recommendedBatchSize
  };
}