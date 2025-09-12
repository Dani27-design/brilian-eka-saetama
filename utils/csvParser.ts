import Papa from 'papaparse';
import { ParsedData, ValidationResult, ValidationError, ValidationWarning } from '@/types/bulkOperations';
import { ProductType } from '@/types/product';

/**
 * Parses a CSV file and returns structured data
 * @param file - The CSV file to parse
 * @returns Promise resolving to parsed data with headers and rows
 */
export async function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        
        resolve({
          headers: results.meta.fields || [],
          rows: results.data as Record<string, any>[]
        });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
}

/**
 * Maps CSV column names to product field names
 * Provides intelligent mapping based on common variations
 * @param headers - Array of CSV headers
 * @returns Mapping of CSV headers to product fields
 */
export function autoMapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  // Common column name variations
  const fieldMappings: Record<string, string[]> = {
    'productNumber': ['productNumber', 'product_number', 'no', 'number', 'kode', 'code'],
    'name': ['name', 'productName', 'product_name', 'nama', 'title'],
    'productType': ['productType', 'product_type', 'type', 'tipe', 'jenis_produk'],
    'brand': ['brand', 'merk', 'merek', 'manufacturer'],
    'brandType': ['brandType', 'brand_type', 'model', 'tipe', 'jenis'],
    'source': ['source', 'sumber', 'vendor', 'supplier'],
    'maintenanceInterval': ['maintenanceInterval', 'maintenance_interval', 'interval', 'maintenance'],
    'serialNumber': ['serialNumber', 'serial_number', 'serial', 'sn'],
    'manufactureDate': ['manufactureDate', 'manufacture_date', 'tanggal_produksi', 'production_date'],
    'installationDate': ['installationDate', 'installation_date', 'tanggal_instalasi', 'install_date'],
    'expirationDate': ['expirationDate', 'expiration_date', 'tanggal_kadaluarsa', 'expire_date'],
    // Type-specific fields
    'height': ['height', 'tinggi'],
    'width': ['width', 'lebar'],
    'pressure': ['pressure', 'tekanan'],
    'capacity': ['capacity', 'kapasitas'],
    'agentType': ['agentType', 'agent_type', 'jenis_media', 'media'],
    'weight': ['weight', 'berat'],
    'flowRate': ['flowRate', 'flow_rate', 'debit'],
    'valveType': ['valveType', 'valve_type', 'tipe_valve'],
    'hoseLength': ['hoseLength', 'hose_length', 'panjang_selang'],
    'material': ['material', 'bahan'],
    'resolution': ['resolution', 'resolusi'],
    'lens': ['lens', 'lensa'],
    'nightVision': ['nightVision', 'night_vision'],
    'power': ['power', 'daya'],
    'connectivity': ['connectivity', 'konektivitas'],
    'pan': ['pan'],
    'tilt': ['tilt'],
    'storageCapacity': ['storageCapacity', 'storage_capacity', 'storage'],
    'sensorType': ['sensorType', 'sensor_type', 'tipe_sensor'],
    'coverageArea': ['coverageArea', 'coverage_area', 'area'],
    'soundLevel': ['soundLevel', 'sound_level', 'volume'],
    'batteryBackup': ['batteryBackup', 'battery_backup', 'battery'],
    'lockType': ['lockType', 'lock_type', 'tipe_kunci'],
    'openingSpeed': ['openingSpeed', 'opening_speed', 'kecepatan_buka'],
    'deviceType': ['deviceType', 'device_type', 'tipe_perangkat'],
    'batteryLife': ['batteryLife', 'battery_life', 'baterai'],
    'patrolInterval': ['patrolInterval', 'patrol_interval'],
    'firmwareVersion': ['firmwareVersion', 'firmware_version', 'firmware']
  };
  
  // Try to match headers with known field names
  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().replace(/\s+/g, '_');
    
    for (const [field, variations] of Object.entries(fieldMappings)) {
      if (variations.some(v => v.toLowerCase() === normalizedHeader)) {
        mapping[header] = field;
        break;
      }
    }
  });
  
  return mapping;
}

/**
 * Validates product data according to business rules
 * @param rows - Array of product data rows
 * @param checkDuplicates - Whether to check for duplicate product numbers
 * @returns Validation result with errors and warnings
 */
export function validateProductData(
  rows: Record<string, any>[],
  checkDuplicates: boolean = true
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const seenProductNumbers = new Set<string>();
  
  // Valid product types
  const validProductTypes: ProductType[] = ['APAR', 'HYDRANT', 'CCTV', 'FIRE_ALARM', 'ACCESS_DOOR', 'PATROL_GUARD'];
  
  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 because of header row and 0-index
    
    // Check required fields
    if (!row.productNumber || row.productNumber.trim() === '') {
      errors.push({
        row: rowNum,
        field: 'productNumber',
        value: row.productNumber,
        message: 'Product number is required'
      });
    } else if (checkDuplicates) {
      // Check for duplicates within the file
      if (seenProductNumbers.has(row.productNumber)) {
        errors.push({
          row: rowNum,
          field: 'productNumber',
          value: row.productNumber,
          message: 'Duplicate product number in file'
        });
      }
      seenProductNumbers.add(row.productNumber);
    }
    
    if (!row.name || row.name.trim() === '') {
      errors.push({
        row: rowNum,
        field: 'name',
        value: row.name,
        message: 'Product name is required'
      });
    }
    
    if (!row.productType || row.productType.trim() === '') {
      errors.push({
        row: rowNum,
        field: 'productType',
        value: row.productType,
        message: 'Product type is required'
      });
    } else if (!validProductTypes.includes(row.productType as ProductType)) {
      errors.push({
        row: rowNum,
        field: 'productType',
        value: row.productType,
        message: `Invalid product type. Must be one of: ${validProductTypes.join(', ')}`
      });
    }
    
    if (!row.brand || row.brand.trim() === '') {
      warnings.push({
        row: rowNum,
        field: 'brand',
        value: row.brand,
        message: 'Brand is recommended'
      });
    }
    
    // Validate dates
    const dateFields = ['manufactureDate', 'installationDate', 'expirationDate'];
    dateFields.forEach(field => {
      if (row[field]) {
        const date = new Date(row[field]);
        if (isNaN(date.getTime())) {
          errors.push({
            row: rowNum,
            field,
            value: row[field],
            message: `Invalid date format. Use YYYY-MM-DD`
          });
        }
      }
    });
    
    // Validate numeric fields
    const numericFields = ['maintenanceInterval', 'height', 'width', 'pressure', 
                          'capacity', 'weight', 'flowRate', 'hoseLength', 
                          'coverageArea', 'soundLevel', 'openingSpeed', 'patrolInterval'];
    numericFields.forEach(field => {
      if (row[field] && isNaN(Number(row[field]))) {
        errors.push({
          row: rowNum,
          field,
          value: row[field],
          message: `${field} must be a number`
        });
      }
    });
    
    // Validate boolean fields
    const booleanFields = ['nightVision', 'pan', 'tilt', 'batteryBackup'];
    booleanFields.forEach(field => {
      if (row[field] && !['Yes', 'No', 'yes', 'no', 'true', 'false', '1', '0'].includes(row[field])) {
        warnings.push({
          row: rowNum,
          field,
          value: row[field],
          message: `${field} should be Yes/No`
        });
      }
    });
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Transforms CSV row data to match product schema
 * @param row - Single row of CSV data
 * @param mapping - Column mapping configuration
 * @returns Transformed product data
 */
export function transformRowToProduct(
  row: Record<string, any>,
  mapping: Record<string, string>
): Record<string, any> {
  const product: Record<string, any> = {};
  
  // Map fields according to mapping configuration
  Object.entries(mapping).forEach(([csvColumn, productField]) => {
    const value = row[csvColumn];
    
    // Skip empty values
    if (value === undefined || value === null || value === '') {
      return;
    }
    
    // Transform boolean values
    if (['nightVision', 'pan', 'tilt', 'batteryBackup'].includes(productField)) {
      product[productField] = ['Yes', 'yes', 'true', '1'].includes(value);
    }
    // Transform numeric values
    else if (['maintenanceInterval', 'height', 'width', 'pressure', 'capacity', 
              'weight', 'flowRate', 'hoseLength', 'coverageArea', 'soundLevel', 
              'openingSpeed', 'patrolInterval'].includes(productField)) {
      const num = Number(value);
      product[productField] = isNaN(num) ? null : num;
    }
    // Keep string values as is
    else {
      product[productField] = value.toString().trim();
    }
  });
  
  return product;
}

/**
 * Estimates the number of Firebase operations needed for import
 * @param rows - Number of rows to import
 * @returns Object with batch count and operation count
 */
export function estimateImportOperations(rows: number): {
  batches: number;
  operations: number;
} {
  const BATCH_SIZE = 500; // Firebase batch limit
  return {
    batches: Math.ceil(rows / BATCH_SIZE),
    operations: rows
  };
}