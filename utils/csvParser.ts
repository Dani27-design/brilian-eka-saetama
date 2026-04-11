import Papa from 'papaparse';
import { ParsedData, ValidationResult, ValidationError, ValidationWarning } from '@/types/bulkOperations';
import { ProductType } from '@/types/product';
import { ValidationMessages, getFieldDisplayName } from './validationMessages';

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
        reject(new Error(ValidationMessages.FAILED_TO_PARSE_CSV(error.message)));
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
  
  // Common column name variations including Indonesian spaced headers with enhanced coverage
  const fieldMappings: Record<string, string[]> = {
    'productNumber': ['productNumber', 'product_number', 'no', 'number', 'kode', 'code', 'Nomor Produk', 'nomor produk', 'nomor_produk'],
    'name': ['name', 'productName', 'product_name', 'nama', 'title', 'Nama Produk', 'nama produk', 'nama_produk'],
    'productType': ['productType', 'product_type', 'type', 'tipe', 'jenis_produk', 'Tipe Produk', 'tipe produk', 'tipe_produk'],
    'brand': ['brand', 'merk', 'merek', 'manufacturer', 'Brand'],
    'brandType': ['brandType', 'brand_type', 'model', 'tipe', 'jenis', 'Tipe Brand', 'tipe brand', 'tipe_brand'],
    'source': ['source', 'sumber', 'vendor', 'supplier', 'Sumber'],
    'maintenanceInterval': ['maintenanceInterval', 'maintenance_interval', 'interval', 'maintenance', 'Interval Maintenance', 'interval maintenance', 'interval_maintenance'],
    'serialNumber': ['serialNumber', 'serial_number', 'serial', 'sn', 'Nomor Seri', 'nomor seri', 'nomor_seri'],
    'manufactureDate': ['manufactureDate', 'manufacture_date', 'tanggal_produksi', 'production_date', 'Tanggal Produksi', 'tanggal produksi', 'tanggal_produksi'],
    'installationDate': ['installationDate', 'installation_date', 'tanggal_instalasi', 'install_date', 'Tanggal Instalasi', 'tanggal instalasi', 'tanggal_instalasi'],
    'expirationDate': ['expirationDate', 'expiration_date', 'tanggal_kadaluarsa', 'expire_date', 'Tanggal Kadaluarsa', 'tanggal kadaluarsa', 'tanggal_kadaluarsa'],
    // Type-specific fields
    'height': ['height', 'tinggi', 'Tinggi'],
    'width': ['width', 'lebar', 'Lebar'],
    'pressure': ['pressure', 'tekanan', 'Tekanan'],
    'capacity': ['capacity', 'kapasitas', 'Kapasitas'],
    'agentType': ['agentType', 'agent_type', 'jenis_media', 'media', 'Jenis Media', 'jenis media', 'jenis_media'],
    'weight': ['weight', 'berat', 'Berat'],
    'flowRate': ['flowRate', 'flow_rate', 'debit', 'Debit Air', 'debit air', 'debit_air'],
    'valveType': ['valveType', 'valve_type', 'tipe_valve', 'Tipe Valve', 'tipe valve', 'tipe_valve'],
    'hoseLength': ['hoseLength', 'hose_length', 'panjang_selang', 'Panjang Selang', 'panjang selang', 'panjang_selang'],
    'material': ['material', 'bahan', 'Material'],
    'resolution': ['resolution', 'resolusi', 'Resolusi'],
    'lens': ['lens', 'lensa', 'Lensa'],
    'nightVision': ['nightVision', 'night_vision', 'Night Vision', 'night vision', 'night_vision'],
    'power': ['power', 'daya', 'Daya'],
    'connectivity': ['connectivity', 'konektivitas', 'Konektivitas'],
    'pan': ['pan', 'Pan'],
    'tilt': ['tilt', 'Tilt'],
    'storageCapacity': ['storageCapacity', 'storage_capacity', 'storage', 'Kapasitas Storage', 'kapasitas storage', 'kapasitas_storage'],
    'sensorType': ['sensorType', 'sensor_type', 'tipe_sensor', 'Tipe Sensor', 'tipe sensor', 'tipe_sensor'],
    'coverageArea': ['coverageArea', 'coverage_area', 'area', 'Area Cakupan', 'area cakupan', 'area_cakupan'],
    'soundLevel': ['soundLevel', 'sound_level', 'volume', 'Level Suara', 'level suara', 'level_suara'],
    'batteryBackup': ['batteryBackup', 'battery_backup', 'battery', 'Backup Baterai', 'backup baterai', 'backup_baterai'],
    'lockType': ['lockType', 'lock_type', 'tipe_kunci', 'Tipe Kunci', 'tipe kunci', 'tipe_kunci'],
    'openingSpeed': ['openingSpeed', 'opening_speed', 'kecepatan_buka', 'Kecepatan Buka', 'kecepatan buka', 'kecepatan_buka'],
    'deviceType': ['deviceType', 'device_type', 'tipe_perangkat', 'Tipe Perangkat', 'tipe perangkat', 'tipe_perangkat'],
    'batteryLife': ['batteryLife', 'battery_life', 'baterai', 'Daya Tahan Baterai', 'daya tahan baterai', 'daya_tahan_baterai'],
    'patrolInterval': ['patrolInterval', 'patrol_interval', 'Interval Patroli', 'interval patroli', 'interval_patroli'],
    'firmwareVersion': ['firmwareVersion', 'firmware_version', 'firmware', 'Versi Firmware', 'versi firmware', 'versi_firmware']
  };
  
  // Try to match headers with known field names using robust normalization
  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim();
    
    for (const [field, variations] of Object.entries(fieldMappings)) {
      if (variations.some(v => {
        const normalizedVariation = v.toLowerCase().trim();
        // Direct match
        if (normalizedVariation === normalizedHeader) return true;
        // Space-underscore equivalence for flexible matching
        if (normalizedVariation.replace(/\s+/g, '_') === normalizedHeader.replace(/\s+/g, '_')) return true;
        return false;
      })) {
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
  const seenProductNumbers = new Set<number>();
  
  // Valid product types
  const validProductTypes: ProductType[] = ['APAR', 'HYDRANT', 'CCTV', 'FIRE_ALARM', 'ACCESS_DOOR', 'PATROL_GUARD'];
  
  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 because of header row and 0-index
    
    // Check required fields and convert productNumber to number
    const productNumber = Number(row.productNumber);
    if (!row.productNumber || row.productNumber.toString().trim() === '' || isNaN(productNumber)) {
      errors.push({
        row: rowNum,
        field: 'productNumber',
        value: row.productNumber,
        message: ValidationMessages.PRODUCT_NUMBER_REQUIRED
      });
    } else if (checkDuplicates) {
      // Check for duplicates within the file
      if (seenProductNumbers.has(productNumber)) {
        errors.push({
          row: rowNum,
          field: 'productNumber',
          value: row.productNumber,
          message: ValidationMessages.DUPLICATE_PRODUCT_NUMBER
        });
      }
      seenProductNumbers.add(productNumber);
    }
    
    // Update the row with numeric productNumber
    row.productNumber = productNumber;
    
    if (!row.name || row.name.trim() === '') {
      errors.push({
        row: rowNum,
        field: 'name',
        value: row.name,
        message: ValidationMessages.PRODUCT_NAME_REQUIRED
      });
    }
    
    if (!row.productType || row.productType.trim() === '') {
      errors.push({
        row: rowNum,
        field: 'productType',
        value: row.productType,
        message: ValidationMessages.PRODUCT_TYPE_REQUIRED
      });
    } else if (!validProductTypes.includes(row.productType as ProductType)) {
      errors.push({
        row: rowNum,
        field: 'productType',
        value: row.productType,
        message: ValidationMessages.INVALID_PRODUCT_TYPE(validProductTypes)
      });
    }
    
    if (!row.brand || row.brand.trim() === '') {
      warnings.push({
        row: rowNum,
        field: 'brand',
        value: row.brand,
        message: ValidationMessages.BRAND_RECOMMENDED
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
            message: ValidationMessages.INVALID_DATE_FORMAT
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
          message: ValidationMessages.INVALID_NUMBER_FORMAT(getFieldDisplayName(field))
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
          message: ValidationMessages.INVALID_BOOLEAN_FORMAT(getFieldDisplayName(field))
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
    else if (['productNumber', 'maintenanceInterval', 'height', 'width', 'pressure', 'capacity',
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