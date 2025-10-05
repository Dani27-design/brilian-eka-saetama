import { Maintenance, InspectionChecklist } from "@/types/maintenances";
import { ProductType } from "@/types/product";
import { formatToWIB, formatDateOnlyWIB } from "./dateFormatter";
import { generatePDFCertificate, downloadPDFCertificate } from "./pdfCertificateGenerator";
import { openCertificateForPrint } from "./pdfCertificatePrint";

/**
 * Converts Firestore timestamp to Date object
 * Handles various timestamp formats from Firestore
 */
function convertFirestoreTimestamp(timestamp: any): Date {
  if (!timestamp) {
    return new Date();
  }
  
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  if (typeof timestamp === 'object' && timestamp.seconds) {
    // Handle Firestore timestamp object {seconds, nanoseconds}
    return new Date(timestamp.seconds * 1000);
  }
  
  // Fallback
  return new Date(timestamp);
}

/**
 * Safely converts any value to string, handling objects gracefully
 */
function safeStringify(value: any): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'object') {
    // Handle common object patterns
    if (value.name) return value.name;
    if (value.address) return value.address;
    if (value.location) return value.location;
    if (value.toString && typeof value.toString === 'function') {
      const str = value.toString();
      if (str !== '[object Object]') return str;
    }
    // Last resort: JSON stringify but try to extract meaningful info
    try {
      return JSON.stringify(value);
    } catch {
      return 'N/A';
    }
  }
  
  return String(value);
}

/**
 * Certificate data structure for PDF generation
 * Contains all necessary information for creating inspection certificates
 */
export interface CertificateData {
  // Certificate Information
  certificateNumber: string;
  issueDate: string;
  validUntil?: string;
  
  // Contract Information
  contractNumber: string;
  contractName: string;
  customerName: string;
  customerAddress?: string;
  
  // Product Information
  productNumber: string;
  productName: string;
  productBrand: string;
  productType: ProductType;
  serialNumber?: string;
  location: string;
  expirationDate?: string;
  
  // Inspection Information
  inspectionDate: string;
  engineerNames: string[];
  checklistResults: {
    totalItems: number;
    passedItems: number;
    failedItems: number;
    details: InspectionChecklist;
  };
  photos: string[];
  
  // Approval Information
  approvedBy: string;
  approvedAt: string;
  approvalNotes?: string;
  
  // Company Information
  companyName: string;
  companyAddress: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string;
}

/**
 * Generates a unique certificate number based on inspection data
 * Format: CERT-{YYYY}-{MM}-{ProductType}-{ProductNumber}
 * 
 * @param certificateData - Certificate data containing product and date information
 * @returns Formatted certificate number
 * 
 * @example
 * generateCertificateNumber(data) 
 * // Returns: "CERT-2025-08-APAR-PRD001"
 */
export function generateCertificateNumber(certificateData: Pick<CertificateData, 'issueDate' | 'productType' | 'productNumber'>): string {
  const date = new Date(certificateData.issueDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Clean product number for certificate (remove special characters)
  const cleanProductNumber = certificateData.productNumber.replace(/[^A-Z0-9]/gi, '');
  
  return `CERT-${year}-${month}-${certificateData.productType}-${cleanProductNumber}`;
}

/**
 * Creates certificate data from inspection maintenance record
 * Transforms complex maintenance data into certificate-ready format
 * 
 * @param maintenanceData - Complete maintenance record with inspection data
 * @param contractData - Contract information including customer details
 * @param productData - Product specifications and details
 * @param engineerNames - Names of engineers who performed the inspection
 * @param approverName - Name of the person who approved the inspection
 * @param location - Physical location where the product is installed
 * @returns Formatted certificate data ready for PDF generation
 * 
 * @example
 * const certData = createCertificateData(
 *   maintenance,
 *   contract,
 *   product,
 *   ["John Doe", "Jane Smith"],
 *   "Supervisor Name",
 *   "Building A, Floor 3"
 * );
 */
export function createCertificateData(
  maintenanceData: Maintenance,
  contractData: any,
  productData: any,
  engineerNames: string[],
  approverName: string,
  location: any
): CertificateData {
  const issueDate = formatToWIB(new Date());
  const inspectionDate = formatToWIB(convertFirestoreTimestamp(maintenanceData.inspection?.createdAt));
  const approvedAt = formatToWIB(convertFirestoreTimestamp(maintenanceData.updatedAt));
  
  // Calculate validity period (typically 1 year from issue date)
  const validUntilDate = new Date();
  validUntilDate.setFullYear(validUntilDate.getFullYear() + 1);
  const validUntil = formatDateOnlyWIB(validUntilDate);
  
  // Process checklist results
  const checklist = maintenanceData.inspection?.checklist || [];
  const checklistResults = {
    totalItems: checklist.length,
    passedItems: checklist.filter((item: any) => item.status === true).length,
    failedItems: checklist.filter((item: any) => item.status === false).length,
    details: checklist,
  };
  
  const certificateData: CertificateData = {
    // Certificate Information
    certificateNumber: '', // Will be generated
    issueDate,
    validUntil,
    
    // Contract Information
    contractNumber: safeStringify(contractData.contractNumber),
    contractName: safeStringify(contractData.contractName),
    customerName: safeStringify(contractData.customerData?.name),
    customerAddress: safeStringify(contractData.customerData?.address),
    
    // Product Information
    productNumber: safeStringify(productData.productNumber),
    productName: safeStringify(productData.name),
    productBrand: safeStringify(productData.specs?.brand),
    productType: maintenanceData.productType,
    serialNumber: productData.specs?.serialNumber || undefined,
    location: safeStringify(location),
    expirationDate: productData.specs?.expirationDate 
      ? formatDateOnlyWIB(convertFirestoreTimestamp(productData.specs.expirationDate))
      : undefined,
    
    // Inspection Information
    inspectionDate,
    engineerNames: engineerNames.map(name => safeStringify(name)),
    checklistResults,
    photos: maintenanceData.inspection?.photos || [],
    
    // Approval Information
    approvedBy: safeStringify(approverName),
    approvedAt,
    approvalNotes: undefined,
    
    // Company Information
    companyName: 'PT Brilian Eka Saetama',
    companyAddress: 'Jakarta, Indonesia',
    companyPhone: '+62-XXX-XXXX-XXXX',
    companyEmail: 'info@brilianeka.com',
    companyLogo: undefined, // Will be handled separately if needed
  };
  
  // Generate certificate number based on complete data
  certificateData.certificateNumber = generateCertificateNumber(certificateData);
  
  return certificateData;
}

/**
 * Generates professional HTML content for certificate
 * Creates print-ready HTML with embedded CSS styling
 * 
 * @param certificateData - Complete certificate data
 * @returns HTML string ready for PDF conversion or printing
 * 
 * @example
 * const htmlContent = generateCertificateHTML(certData);
 * // Returns formatted HTML string with CSS
 */
export function generateCertificateHTML(certificateData: CertificateData): string {
  const passRate = certificateData.checklistResults.totalItems > 0
    ? Math.round((certificateData.checklistResults.passedItems / certificateData.checklistResults.totalItems) * 100)
    : 0;

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sertifikat Inspeksi - ${certificateData.certificateNumber}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                font-size: 11px;
                line-height: 1.4;
                color: #2d3748;
                background: white;
                padding: 20px;
            }
            
            .certificate-container {
                max-width: 210mm;
                margin: 0 auto;
                background: white;
                border: 2px solid #e53e3e;
                padding: 30px;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e53e3e;
            }
            
            .company-logo {
                width: 80px;
                height: 80px;
                background: #e53e3e;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 16px;
            }
            
            .company-info {
                text-align: right;
            }
            
            .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #e53e3e;
                margin-bottom: 5px;
            }
            
            .company-details {
                font-size: 10px;
                color: #666;
                margin-bottom: 2px;
            }
            
            .title-section {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .certificate-title {
                font-size: 28px;
                font-weight: bold;
                color: #2d3748;
                margin-bottom: 10px;
            }
            
            .certificate-subtitle {
                font-size: 14px;
                color: #666;
            }
            
            .cert-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
                padding: 15px;
                background: #f7fafc;
                border: 1px solid #e2e8f0;
            }
            
            .info-item {
                margin-bottom: 8px;
            }
            
            .info-label {
                font-weight: bold;
                color: #4a5568;
                font-size: 10px;
            }
            
            .info-value {
                color: #2d3748;
                font-size: 12px;
            }
            
            .section {
                margin-bottom: 20px;
            }
            
            .section-title {
                font-size: 16px;
                font-weight: bold;
                color: #e53e3e;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .product-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            
            .product-item {
                margin-bottom: 4px;
            }
            
            .item-label {
                font-weight: bold;
                color: #4a5568;
            }
            
            .summary-box {
                background: #edf2f7;
                border: 1px solid #cbd5e0;
                padding: 15px;
                margin-bottom: 20px;
            }
            
            .summary-title {
                font-size: 14px;
                font-weight: bold;
                color: #2d3748;
                margin-bottom: 10px;
            }
            
            .summary-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            
            .summary-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }
            
            .summary-label {
                color: #4a5568;
            }
            
            .summary-value {
                font-weight: bold;
                color: #2d3748;
            }
            
            .status-pass {
                color: #38a169;
                font-weight: bold;
            }
            
            .status-fail {
                color: #e53e3e;
                font-weight: bold;
            }
            
            .checklist-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
            }
            
            .checklist-table th,
            .checklist-table td {
                border: 1px solid #e2e8f0;
                padding: 8px 5px;
                text-align: left;
                font-size: 9px;
            }
            
            .checklist-table th {
                background: #f7fafc;
                font-weight: bold;
                color: #4a5568;
            }
            
            .col-no { width: 5%; text-align: center; }
            .col-item { width: 60%; }
            .col-status { width: 15%; text-align: center; }
            .col-remarks { width: 20%; }
            
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
            }
            
            .approval-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-bottom: 20px;
            }
            
            .approval-box {
                text-align: center;
            }
            
            .approval-title {
                font-weight: bold;
                color: #4a5568;
                margin-bottom: 30px;
            }
            
            .signature-line {
                border-bottom: 1px solid #4a5568;
                margin-bottom: 5px;
                height: 40px;
            }
            
            .signature-name {
                font-size: 10px;
                color: #4a5568;
            }
            
            .disclaimer {
                font-size: 8px;
                color: #666;
                text-align: center;
                margin-top: 10px;
            }
            
            @media print {
                body { padding: 0; }
                .certificate-container { border: none; }
            }
        </style>
    </head>
    <body>
        <div class="certificate-container">
            <!-- Header -->
            <div class="header">
                <div class="company-logo">LOGO</div>
                <div class="company-info">
                    <div class="company-name">${certificateData.companyName}</div>
                    <div class="company-details">${certificateData.companyAddress}</div>
                    ${certificateData.companyPhone ? `<div class="company-details">Tel: ${certificateData.companyPhone}</div>` : ''}
                    ${certificateData.companyEmail ? `<div class="company-details">Email: ${certificateData.companyEmail}</div>` : ''}
                </div>
            </div>
            
            <!-- Title -->
            <div class="title-section">
                <div class="certificate-title">SERTIFIKAT INSPEKSI</div>
                <div class="certificate-subtitle">Inspection Certificate for ${certificateData.productType} Equipment</div>
            </div>
            
            <!-- Certificate Info -->
            <div class="cert-info">
                <div>
                    <div class="info-item">
                        <div class="info-label">Certificate Number:</div>
                        <div class="info-value">${certificateData.certificateNumber}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Issue Date:</div>
                        <div class="info-value">${certificateData.issueDate}</div>
                    </div>
                    ${certificateData.validUntil ? `
                    <div class="info-item">
                        <div class="info-label">Valid Until:</div>
                        <div class="info-value">${certificateData.validUntil}</div>
                    </div>
                    ` : ''}
                </div>
                <div>
                    <div class="info-item">
                        <div class="info-label">Contract Number:</div>
                        <div class="info-value">${certificateData.contractNumber}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Customer:</div>
                        <div class="info-value">${certificateData.customerName}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Inspection Date:</div>
                        <div class="info-value">${certificateData.inspectionDate}</div>
                    </div>
                </div>
            </div>
            
            <!-- Product Information -->
            <div class="section">
                <div class="section-title">Product Information</div>
                <div class="product-grid">
                    <div>
                        <div class="product-item">
                            <span class="item-label">Product Number:</span> ${certificateData.productNumber}
                        </div>
                        <div class="product-item">
                            <span class="item-label">Product Name:</span> ${certificateData.productName}
                        </div>
                        <div class="product-item">
                            <span class="item-label">Brand:</span> ${certificateData.productBrand}
                        </div>
                        <div class="product-item">
                            <span class="item-label">Type:</span> ${certificateData.productType}
                        </div>
                    </div>
                    <div>
                        ${certificateData.serialNumber ? `
                        <div class="product-item">
                            <span class="item-label">Serial Number:</span> ${certificateData.serialNumber}
                        </div>
                        ` : ''}
                        <div class="product-item">
                            <span class="item-label">Location:</span> ${certificateData.location}
                        </div>
                        ${certificateData.expirationDate ? `
                        <div class="product-item">
                            <span class="item-label">Expiration Date:</span> ${certificateData.expirationDate}
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Summary -->
            <div class="summary-box">
                <div class="summary-title">Inspection Results Summary</div>
                <div class="summary-grid">
                    <div>
                        <div class="summary-item">
                            <span class="summary-label">Total Checklist Items:</span>
                            <span class="summary-value">${certificateData.checklistResults.totalItems}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Passed Items:</span>
                            <span class="summary-value status-pass">${certificateData.checklistResults.passedItems}</span>
                        </div>
                    </div>
                    <div>
                        <div class="summary-item">
                            <span class="summary-label">Failed Items:</span>
                            <span class="summary-value status-fail">${certificateData.checklistResults.failedItems}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Pass Rate:</span>
                            <span class="summary-value">${passRate}%</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Detailed Results -->
            <div class="section">
                <div class="section-title">Detailed Inspection Results</div>
                <table class="checklist-table">
                    <thead>
                        <tr>
                            <th class="col-no">No.</th>
                            <th class="col-item">Inspection Item</th>
                            <th class="col-status">Status</th>
                            <th class="col-remarks">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${certificateData.checklistResults.details.map((item: any, index: number) => `
                        <tr>
                            <td class="col-no">${index + 1}</td>
                            <td class="col-item">${item.item || `Item ${index + 1}`}</td>
                            <td class="col-status">
                                <span class="${item.status ? 'status-pass' : 'status-fail'}">
                                    ${item.status ? 'PASS' : 'FAIL'}
                                </span>
                            </td>
                            <td class="col-remarks">${item.remarks || '-'}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <!-- Inspector Info -->
            <div class="section">
                <div class="section-title">Inspector Information</div>
                <div class="product-item">
                    <span class="item-label">Inspection performed by:</span> ${certificateData.engineerNames.join(', ')}
                </div>
                <div class="product-item">
                    <span class="item-label">Number of photos taken:</span> ${certificateData.photos.length}
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="approval-section">
                    <div class="approval-box">
                        <div class="approval-title">Inspector</div>
                        <div class="signature-line"></div>
                        <div class="signature-name">${certificateData.engineerNames[0] || 'Inspector Name'}</div>
                    </div>
                    <div class="approval-box">
                        <div class="approval-title">Approved By</div>
                        <div class="signature-line"></div>
                        <div class="signature-name">${certificateData.approvedBy}</div>
                        <div class="signature-name">${certificateData.approvedAt}</div>
                    </div>
                </div>
                <div class="disclaimer">
                    This certificate is electronically generated and valid without signature. 
                    For verification, please contact ${certificateData.companyName}.
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Opens certificate HTML in a new window for printing
 * Provides immediate access to printable certificate without PDF conversion
 * 
 * @param certificateData - Complete certificate data
 * @param windowTitle - Optional title for the print window
 * 
 * @example
 * printCertificate(certData, "Certificate PRD001");
 * // Opens new window with printable certificate
 */
export function printCertificate(
  certificateData: CertificateData,
  windowTitle?: string
): void {
  try {
    const htmlContent = generateCertificateHTML(certificateData);
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      throw new Error('Popup diblokir. Silakan izinkan popup untuk mencetak sertifikat.');
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Set window title
    if (windowTitle) {
      printWindow.document.title = windowTitle;
    }
    
    // Auto-focus and print
    printWindow.focus();
    
    // Small delay to ensure content is loaded before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
  } catch (error) {
    console.error('Error opening print window:', error);
    throw new Error('Gagal membuka jendela cetak sertifikat');
  }
}

/**
 * Downloads certificate as HTML file
 * Alternative method for users who prefer HTML format over PDF
 * 
 * @param certificateData - Complete certificate data
 * @param filename - Optional custom filename (without extension)
 * 
 * @example
 * downloadCertificateHTML(certData, "certificate_PRD001");
 * // Downloads: "certificate_PRD001.html"
 */
export function downloadCertificateHTML(
  certificateData: CertificateData,
  filename?: string
): void {
  try {
    const htmlContent = generateCertificateHTML(certificateData);
    
    // Create download filename
    const downloadFilename = filename 
      ? `${filename}.html`
      : `certificate_${certificateData.certificateNumber}.html`;
    
    // Create and trigger download
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = downloadFilename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error downloading certificate HTML:', error);
    throw new Error('Gagal mengunduh sertifikat HTML');
  }
}

/**
 * Validates certificate data before generation
 * Ensures all required fields are present and properly formatted
 * 
 * @param certificateData - Certificate data to validate
 * @returns Validation result with success status and error messages
 * 
 * @example
 * const validation = validateCertificateData(certData);
 * if (!validation.isValid) {
 *   console.error("Validation errors:", validation.errors);
 * }
 */
export function validateCertificateData(certificateData: CertificateData): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required fields
  const requiredFields = [
    'certificateNumber',
    'issueDate',
    'contractNumber',
    'customerName',
    'productNumber',
    'productName',
    'productType',
    'inspectionDate',
    'approvedBy',
    'companyName'
  ];
  
  requiredFields.forEach(field => {
    if (!certificateData[field as keyof CertificateData]) {
      errors.push(`Field '${field}' is required`);
    }
  });
  
  // Check checklist data
  if (!certificateData.checklistResults.details || certificateData.checklistResults.details.length === 0) {
    errors.push('Checklist data is required for certificate generation');
  }
  
  // Check engineer names
  if (!certificateData.engineerNames || certificateData.engineerNames.length === 0) {
    warnings.push('No engineer names provided');
  }
  
  // Check if inspection passed
  if (certificateData.checklistResults.failedItems > 0) {
    warnings.push(`Certificate contains ${certificateData.checklistResults.failedItems} failed items`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Gets certificate generation statistics
 * Provides overview of certificate content for preview
 * 
 * @param certificateData - Certificate data to analyze
 * @returns Statistics object with certificate metrics
 * 
 * @example
 * const stats = getCertificateStats(certData);
 * console.log(`Certificate covers ${stats.totalChecklistItems} inspection items`);
 */
export function getCertificateStats(certificateData: CertificateData): {
  totalChecklistItems: number;
  passRate: number;
  hasPhotos: boolean;
  engineerCount: number;
  estimatedPages: number;
} {
  const passRate = certificateData.checklistResults.totalItems > 0
    ? Math.round((certificateData.checklistResults.passedItems / certificateData.checklistResults.totalItems) * 100)
    : 0;
    
  // Estimate pages (rough calculation for print)
  const basePages = 1;
  const checklistPages = Math.ceil(certificateData.checklistResults.totalItems / 20); // ~20 items per page
  const estimatedPages = basePages + checklistPages;
  
  return {
    totalChecklistItems: certificateData.checklistResults.totalItems,
    passRate,
    hasPhotos: certificateData.photos.length > 0,
    engineerCount: certificateData.engineerNames.length,
    estimatedPages
  };
}

/**
 * Opens PDF certificate and triggers browser's native print dialog
 * Simple browser print functionality without custom modal
 * 
 * @param certificateData - Complete certificate data
 * @param inspectorId - ID of the inspector for QR signature
 * @param approverId - ID of the approver for QR signature  
 * @param windowTitle - Optional title for print window
 * 
 * @example
 * await printPDFCertificate(certData, "inspector123", "approver456");
 */
export async function printPDFCertificate(
  certificateData: CertificateData,
  inspectorId: string,
  approverId: string,
  windowTitle?: string
): Promise<void> {
  try {
    // Direct PDF print without fallback chain to avoid double popups
    await openCertificateForPrint(certificateData, inspectorId, approverId, {
      windowTitle: windowTitle || "Certificate",
    });
  } catch (error) {
    console.error("Error opening certificate for print:", error);
    // Pass through the actual error instead of masking it
    if (error instanceof Error) {
      throw error; // Pass through the actual error
    } else {
      throw new Error(`Certificate generation failed: ${String(error)}`);
    }
  }
}

/**
 * Downloads PDF certificate directly (legacy method)
 * Use this for bulk operations or when print preview is not needed
 * 
 * @param certificateData - Complete certificate data
 * @param inspectorId - ID of the inspector for QR signature
 * @param approverId - ID of the approver for QR signature  
 * @param filename - Optional filename (without extension)
 * 
 * @example
 * await downloadPDFCertificate(certData, "inspector123", "approver456", "certificate_PRD001");
 */
export async function downloadPDFCertificateDirectly(
  certificateData: CertificateData,
  inspectorId: string,
  approverId: string,
  filename?: string
): Promise<void> {
  try {
    await downloadPDFCertificate(certificateData, inspectorId, approverId, filename);
  } catch (error) {
    console.error("Error generating PDF certificate:", error);
    // No fallback - throw error for user to handle
    throw error;
  }
}

/**
 * Generates PDF certificate blob for further processing
 * Useful for bulk operations or custom handling
 * 
 * @param certificateData - Complete certificate data
 * @param inspectorId - ID of the inspector for QR signature
 * @param approverId - ID of the approver for QR signature
 * @returns Promise that resolves to PDF blob
 * 
 * @example
 * const pdfBlob = await generateCertificatePDFBlob(certData, "inspector123", "approver456");
 * // Use blob for custom operations
 */
export async function generateCertificatePDFBlob(
  certificateData: CertificateData,
  inspectorId: string,
  approverId: string
): Promise<Blob> {
  return await generatePDFCertificate(certificateData, inspectorId, approverId);
}