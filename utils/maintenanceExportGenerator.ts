import { MaintenanceTableRow } from "./maintenanceDataLoader";
import { MaintenanceStatus } from "@/types/maintenances";
import { ProductType } from "@/types/product";

/**
 * Configuration options for maintenance export
 */
export interface MaintenanceExportConfig {
  includeInspectionDetails: boolean;
  includeContractInfo: boolean;
  includeEngineerDetails: boolean;
  includeProductSpecs: boolean;
  format: 'csv' | 'excel';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Default export configuration
 */
export const DEFAULT_MAINTENANCE_EXPORT_CONFIG: MaintenanceExportConfig = {
  includeInspectionDetails: true,
  includeContractInfo: true,
  includeEngineerDetails: true,
  includeProductSpecs: false,
  format: 'csv'
};

/**
 * Status display names for export
 */
const STATUS_DISPLAY_NAMES: Record<MaintenanceStatus, string> = {
  scheduled: "Dijadwalkan",
  pending: "Tertunda",
  in_progress: "Sedang Dikerjakan",
  waiting_approval: "Menunggu Disetujui",
  approved: "Disetujui",
  rejected: "Ditolak"
};

/**
 * Product type display names for export
 */
const PRODUCT_TYPE_DISPLAY_NAMES: Record<ProductType, string> = {
  APAR: "APAR",
  HYDRANT: "Hydrant",
  CCTV: "CCTV",
  FIRE_ALARM: "Fire Alarm",
  ACCESS_DOOR: "Access Door",
  PATROL_GUARD: "Patrol Guard"
};

/**
 * Formats a date for export
 */
function formatDateForExport(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString('id-ID');
}

/**
 * Formats inspection data for export
 */
function formatInspectionData(inspection: any): {
  inspectionStatus: string;
  inspectionDate: string;
  inspectionResults: string;
  photoCount: string;
} {
  if (!inspection) {
    return {
      inspectionStatus: "Belum Diinspeksi",
      inspectionDate: "",
      inspectionResults: "",
      photoCount: "0"
    };
  }

  const checklist = inspection.checklist || [];
  const okCount = checklist.filter((item: any) => item.status === true).length;
  const totalCount = checklist.length;
  
  const results = checklist.map((item: any) => 
    `${item.item}: ${item.status ? 'OK' : 'NOK'}${item.remarks ? ` (${item.remarks})` : ''}`
  ).join('; ');

  return {
    inspectionStatus: "Sudah Diinspeksi",
    inspectionDate: inspection.createdAt ? formatDateForExport(inspection.createdAt.toDate()) : "",
    inspectionResults: `${okCount}/${totalCount} OK - ${results}`,
    photoCount: inspection.photos ? inspection.photos.length.toString() : "0"
  };
}

/**
 * Converts maintenance data to flat object for export
 */
function flattenMaintenanceForExport(
  maintenance: MaintenanceTableRow,
  config: MaintenanceExportConfig
): Record<string, any> {
  const flat: Record<string, any> = {
    // Basic maintenance info
    'ID Maintenance': maintenance.id,
    'Status': STATUS_DISPLAY_NAMES[maintenance.status] || maintenance.status,
    'Tanggal Mulai': formatDateForExport(maintenance.startDate),
    'Tanggal Selesai': formatDateForExport(maintenance.endDate),
    
    // Product info
    'Nomor Produk': maintenance.productNumber,
    'Nama Produk': maintenance.productName,
    'Tipe Produk': PRODUCT_TYPE_DISPLAY_NAMES[maintenance.productType] || maintenance.productType,
  };

  // Contract information
  if (config.includeContractInfo && maintenance.contractData) {
    flat['Nomor Kontrak'] = maintenance.contractNumber;
    flat['Nama Kontrak'] = maintenance.contractName;
    
    if (maintenance.contractData.customerData) {
      flat['Nama Customer'] = maintenance.contractData.customerData.name;
    }
  }

  // Engineer information
  if (config.includeEngineerDetails) {
    flat['Teknisi'] = maintenance.engineers.map(e => e.name).join(', ') || 'Belum Ditugaskan';
    flat['Jumlah Teknisi'] = maintenance.engineers.length;
  }

  // Inspection details
  if (config.includeInspectionDetails) {
    const inspectionData = formatInspectionData(maintenance.inspection);
    flat['Status Inspeksi'] = inspectionData.inspectionStatus;
    flat['Tanggal Inspeksi'] = inspectionData.inspectionDate;
    flat['Hasil Inspeksi'] = inspectionData.inspectionResults;
    flat['Jumlah Foto'] = inspectionData.photoCount;
  }

  // Product specifications
  if (config.includeProductSpecs && maintenance.productData?.specs) {
    const specs = maintenance.productData.specs;
    flat['Brand'] = specs.brand || '';
    flat['Brand Type'] = specs.brandType || '';
    flat['Serial Number'] = specs.serialNumber || '';
    
    // Add type-specific specs
    switch (maintenance.productType) {
      case 'APAR':
        flat['Kapasitas'] = specs.capacity || '';
        flat['Tekanan'] = specs.pressure || '';
        flat['Jenis Agent'] = specs.agentType || '';
        break;
      case 'HYDRANT':
        flat['Flow Rate'] = specs.flowRate || '';
        flat['Tekanan'] = specs.pressure || '';
        flat['Tipe Valve'] = specs.valveType || '';
        break;
      case 'CCTV':
        flat['Resolusi'] = specs.resolution || '';
        flat['Night Vision'] = specs.nightVision ? 'Ya' : 'Tidak';
        break;
      // Add other product types as needed
    }
  }

  return flat;
}

/**
 * Converts an array of objects to CSV string
 */
function objectArrayToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes in CSV
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
}

/**
 * Exports maintenances to CSV format
 */
export function maintenancesToCSV(
  maintenances: MaintenanceTableRow[],
  config: MaintenanceExportConfig = DEFAULT_MAINTENANCE_EXPORT_CONFIG
): string {
  const flattenedData = maintenances.map(maintenance => 
    flattenMaintenanceForExport(maintenance, config)
  );

  return objectArrayToCSV(flattenedData);
}

/**
 * Creates and downloads maintenance export file
 */
export function downloadMaintenanceExport(
  maintenances: MaintenanceTableRow[],
  config: MaintenanceExportConfig = DEFAULT_MAINTENANCE_EXPORT_CONFIG,
  filename?: string
): void {
  try {
    const csvData = maintenancesToCSV(maintenances, config);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    
    const defaultFilename = `maintenance-export-${new Date().toISOString().slice(0, 10)}.csv`;
    const finalFilename = filename || defaultFilename;
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading maintenance export:', error);
    throw new Error('Failed to download maintenance export');
  }
}

/**
 * Generates maintenance summary statistics
 */
export function generateMaintenanceSummary(maintenances: MaintenanceTableRow[]): {
  total: number;
  byStatus: Record<MaintenanceStatus, number>;
  byProductType: Record<ProductType, number>;
  withInspection: number;
  withoutInspection: number;
  engineersAssigned: number;
  engineersUnassigned: number;
} {
  const summary = {
    total: maintenances.length,
    byStatus: {} as Record<MaintenanceStatus, number>,
    byProductType: {} as Record<ProductType, number>,
    withInspection: 0,
    withoutInspection: 0,
    engineersAssigned: 0,
    engineersUnassigned: 0
  };

  // Initialize status counts
  Object.keys(STATUS_DISPLAY_NAMES).forEach(status => {
    summary.byStatus[status as MaintenanceStatus] = 0;
  });

  // Initialize product type counts
  Object.keys(PRODUCT_TYPE_DISPLAY_NAMES).forEach(type => {
    summary.byProductType[type as ProductType] = 0;
  });

  // Count statistics
  maintenances.forEach(maintenance => {
    // Status counts
    summary.byStatus[maintenance.status]++;
    
    // Product type counts
    summary.byProductType[maintenance.productType]++;
    
    // Inspection counts
    if (maintenance.hasInspection) {
      summary.withInspection++;
    } else {
      summary.withoutInspection++;
    }
    
    // Engineer assignment counts
    if (maintenance.engineers.length > 0) {
      summary.engineersAssigned++;
    } else {
      summary.engineersUnassigned++;
    }
  });

  return summary;
}