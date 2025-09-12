import { Product, ProductSpecs, ProductType } from "@/types/product";
import { ExportConfig } from "@/types/bulkOperations";
import { Timestamp } from "firebase/firestore";

/**
 * Converts a Firestore Timestamp to a formatted date string
 * @param timestamp - Firestore timestamp or null
 * @returns Formatted date string or empty string
 */
function formatTimestamp(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return "";
  try {
    const date = timestamp.toDate();
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch {
    return "";
  }
}

/**
 * Formats a product's specifications into a flat object for export
 * @param specs - Product specifications
 * @param productType - Type of the product
 * @returns Flat object with all specification fields
 */
function flattenSpecs(specs: ProductSpecs, productType: ProductType): Record<string, any> {
  const flat: Record<string, any> = {
    brand: specs.brand || "",
    brandType: specs.brandType || "",
    serialNumber: specs.serialNumber || "",
    manufactureDate: formatTimestamp((specs as any).manufactureDate),
    installationDate: formatTimestamp((specs as any).installationDate),
    expirationDate: formatTimestamp((specs as any).expirationDate),
  };

  // Add type-specific fields
  switch (productType) {
    case "APAR":
      flat.height = (specs as any).height || "";
      flat.width = (specs as any).width || "";
      flat.pressure = (specs as any).pressure || "";
      flat.capacity = (specs as any).capacity || "";
      flat.agentType = (specs as any).agentType || "";
      flat.weight = (specs as any).weight || "";
      break;
    case "HYDRANT":
      flat.height = (specs as any).height || "";
      flat.width = (specs as any).width || "";
      flat.flowRate = (specs as any).flowRate || "";
      flat.pressure = (specs as any).pressure || "";
      flat.valveType = (specs as any).valveType || "";
      flat.hoseLength = (specs as any).hoseLength || "";
      flat.material = (specs as any).material || "";
      break;
    case "CCTV":
      flat.resolution = (specs as any).resolution || "";
      flat.lens = (specs as any).lens || "";
      flat.nightVision = (specs as any).nightVision ? "Yes" : "No";
      flat.power = (specs as any).power || "";
      flat.connectivity = (specs as any).connectivity || "";
      flat.pan = (specs as any).pan ? "Yes" : "No";
      flat.tilt = (specs as any).tilt ? "Yes" : "No";
      flat.storageCapacity = (specs as any).storageCapacity || "";
      break;
    case "FIRE_ALARM":
      flat.sensorType = (specs as any).sensorType || "";
      flat.power = (specs as any).power || "";
      flat.coverageArea = (specs as any).coverageArea || "";
      flat.soundLevel = (specs as any).soundLevel || "";
      flat.batteryBackup = (specs as any).batteryBackup ? "Yes" : "No";
      flat.connectivity = (specs as any).connectivity || "";
      break;
    case "ACCESS_DOOR":
      flat.material = (specs as any).material || "";
      flat.lockType = (specs as any).lockType || "";
      flat.width = (specs as any).width || "";
      flat.height = (specs as any).height || "";
      flat.openingSpeed = (specs as any).openingSpeed || "";
      break;
    case "PATROL_GUARD":
      flat.deviceType = (specs as any).deviceType || "";
      flat.batteryLife = (specs as any).batteryLife || "";
      flat.connectivity = (specs as any).connectivity || "";
      flat.patrolInterval = (specs as any).patrolInterval || "";
      flat.firmwareVersion = (specs as any).firmwareVersion || "";
      break;
  }

  return flat;
}

/**
 * Converts products array to CSV string
 * @param products - Array of products to export
 * @param includeSpecs - Whether to include specification columns
 * @returns CSV string with headers and data
 */
export function productsToCSV(
  products: (Product & { contractData?: any })[],
  includeSpecs: boolean = true
): string {
  if (products.length === 0) {
    return "No data to export";
  }

  // Define base headers
  const baseHeaders = [
    "productNumber",
    "name",
    "productType",
    "source",
    "maintenanceInterval"
  ];

  // Add spec headers if needed
  const specHeaders = includeSpecs ? [
    "brand",
    "brandType",
    "serialNumber",
    "manufactureDate",
    "installationDate",
    "expirationDate",
    // Type-specific headers (include all possible ones)
    "height",
    "width",
    "pressure",
    "capacity",
    "agentType",
    "weight",
    "flowRate",
    "valveType",
    "hoseLength",
    "material",
    "resolution",
    "lens",
    "nightVision",
    "power",
    "connectivity",
    "pan",
    "tilt",
    "storageCapacity",
    "sensorType",
    "coverageArea",
    "soundLevel",
    "batteryBackup",
    "lockType",
    "openingSpeed",
    "deviceType",
    "batteryLife",
    "patrolInterval",
    "firmwareVersion"
  ] : [];

  // Add contract headers
  const contractHeaders = [
    "contractNumber",
    "contractName",
    "customerName",
    "contractStatus"
  ];

  const allHeaders = [...baseHeaders, ...specHeaders, ...contractHeaders];

  // Create CSV rows
  const rows = products.map(product => {
    const baseData = {
      productNumber: product.productNumber || "",
      name: product.name || "",
      productType: product.productType || "",
      source: product.source || "",
      maintenanceInterval: product.maintenanceInterval || 0
    };

    const specData = includeSpecs && product.specs 
      ? flattenSpecs(product.specs, product.productType)
      : {};

    const contractData = {
      contractNumber: product.contractData?.contractNumber || "",
      contractName: product.contractData?.contractName || "",
      customerName: product.contractData?.customerData?.name || "",
      contractStatus: product.contractData?.status || ""
    };

    const rowData = { ...baseData, ...specData, ...contractData };

    // Map to headers order
    return allHeaders.map(header => {
      const value = rowData[header];
      // Escape values that contain commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? "";
    }).join(',');
  });

  // Combine headers and rows
  return [allHeaders.join(','), ...rows].join('\n');
}

/**
 * Downloads data as a CSV file
 * @param csvContent - CSV string content
 * @param filename - Name of the file to download
 */
export function downloadCSV(csvContent: string, filename: string = 'products_export.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Exports products to CSV format and triggers download
 * @param products - Products to export
 * @param config - Export configuration
 * @returns Promise that resolves when export is complete
 */
export async function exportProducts(
  products: (Product & { contractData?: any })[],
  config: Partial<ExportConfig> = {}
): Promise<void> {
  try {
    const csvContent = productsToCSV(products, config.includeSpecs !== false);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `products_export_${timestamp}.csv`;
    
    downloadCSV(csvContent, filename);
  } catch (error) {
    console.error('Error exporting products:', error);
    throw new Error('Failed to export products');
  }
}

/**
 * Generates a CSV template for product import
 * @param productType - Optional specific product type for template
 * @returns CSV template string
 */
export function generateImportTemplate(productType?: ProductType): string {
  const headers = [
    "productNumber",
    "name", 
    "productType",
    "brand",
    "brandType",
    "source",
    "maintenanceInterval",
    "serialNumber",
    "manufactureDate",
    "installationDate",
    "expirationDate"
  ];

  // Add type-specific headers
  if (productType) {
    switch (productType) {
      case "APAR":
        headers.push("height", "width", "pressure", "capacity", "agentType", "weight");
        break;
      case "HYDRANT":
        headers.push("height", "width", "flowRate", "pressure", "valveType", "hoseLength", "material");
        break;
      case "CCTV":
        headers.push("resolution", "lens", "nightVision", "power", "connectivity", "pan", "tilt", "storageCapacity");
        break;
      case "FIRE_ALARM":
        headers.push("sensorType", "power", "coverageArea", "soundLevel", "batteryBackup", "connectivity");
        break;
      case "ACCESS_DOOR":
        headers.push("material", "lockType", "width", "height", "openingSpeed");
        break;
      case "PATROL_GUARD":
        headers.push("deviceType", "batteryLife", "connectivity", "patrolInterval", "firmwareVersion");
        break;
    }
  }

  // Create sample row
  const sampleRow = [
    "PRD-001",
    "Sample Product Name",
    productType || "APAR",
    "Brand Name",
    "Model/Type",
    "VENDOR ABC",
    "30",
    "SN123456",
    "2024-01-01",
    "2024-01-15",
    "2025-01-15"
  ];

  // Add type-specific sample data
  if (productType) {
    switch (productType) {
      case "APAR":
        sampleRow.push("70", "20", "15", "3", "Powder", "3.5");
        break;
      case "HYDRANT":
        sampleRow.push("150", "60", "500", "10", "Ball Valve", "30", "Steel");
        break;
      case "CCTV":
        sampleRow.push("1080p", "3.6mm", "Yes", "12V", "WiFi", "Yes", "Yes", "256GB");
        break;
      case "FIRE_ALARM":
        sampleRow.push("Smoke", "24V", "50", "85", "Yes", "Wired");
        break;
      case "ACCESS_DOOR":
        sampleRow.push("Steel", "Electronic", "90", "210", "5");
        break;
      case "PATROL_GUARD":
        sampleRow.push("Handheld", "8 hours", "Bluetooth", "60", "v2.1.0");
        break;
    }
  }

  return [headers.join(','), sampleRow.join(',')].join('\n');
}