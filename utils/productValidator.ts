import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '@/db/firebase/firebaseConfig';
import { Product, ProductType, ProductSpecs } from '@/types/product';
import { Timestamp } from 'firebase/firestore';

/**
 * Checks if a product number already exists in the database
 * @param productNumber - The product number to check
 * @returns Promise resolving to true if exists, false otherwise
 */
export async function checkProductNumberExists(productNumber: number): Promise<boolean> {
  try {
    const q = query(
      collection(firestore, 'products'),
      where('productNumber', '==', productNumber)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking product number:', error);
    return false;
  }
}

/**
 * Batch checks multiple product numbers for existence
 * @param productNumbers - Array of product numbers to check
 * @returns Promise resolving to set of existing product numbers
 */
export async function checkMultipleProductNumbers(
  productNumbers: number[]
): Promise<Set<number>> {
  const existingNumbers = new Set<number>();
  
  // Firebase 'in' query is limited to 10 items, so we need to batch
  const batchSize = 10;
  for (let i = 0; i < productNumbers.length; i += batchSize) {
    const batch = productNumbers.slice(i, i + batchSize);
    
    try {
      const q = query(
        collection(firestore, 'products'),
        where('productNumber', 'in', batch)
      );
      const snapshot = await getDocs(q);
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.productNumber) {
          existingNumbers.add(data.productNumber);
        }
      });
    } catch (error) {
      console.error('Error checking batch of product numbers:', error);
    }
  }
  
  return existingNumbers;
}

/**
 * Batch checks multiple product numbers and returns their document IDs
 * @param productNumbers - Array of product numbers to check
 * @returns Promise resolving to map of productNumber → documentId
 */
export async function getExistingProductMap(
  productNumbers: number[]
): Promise<Map<number, string>> {
  const existingMap = new Map<number, string>();

  const batchSize = 10;
  for (let i = 0; i < productNumbers.length; i += batchSize) {
    const batch = productNumbers.slice(i, i + batchSize);

    try {
      const q = query(
        collection(firestore, 'products'),
        where('productNumber', 'in', batch)
      );
      const snapshot = await getDocs(q);

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.productNumber) {
          existingMap.set(data.productNumber, docSnap.id);
        }
      });
    } catch (error) {
      console.error('Error checking batch of product numbers:', error);
    }
  }

  return existingMap;
}

/**
 * Converts date string to Firestore Timestamp
 * @param dateString - Date string in various formats
 * @returns Firestore Timestamp or null if invalid
 */
export function parseDate(dateString: string | null | undefined): Timestamp | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return Timestamp.fromDate(date);
  } catch {
    return null;
  }
}

/**
 * Builds product specs object based on product type
 * @param data - Raw product data
 * @param productType - Type of the product
 * @returns Properly typed ProductSpecs object
 */
export function buildProductSpecs(
  data: Record<string, any>,
  productType: ProductType
): ProductSpecs {
  const baseSpecs = {
    brand: data.brand || '',
    brandType: data.brandType || '',
    serialNumber: data.serialNumber || null,
    manufactureDate: parseDate(data.manufactureDate),
    installationDate: parseDate(data.installationDate),
    expirationDate: parseDate(data.expirationDate)
  };
  
  switch (productType) {
    case 'APAR':
      return {
        ...baseSpecs,
        height: data.height ? Number(data.height) : null,
        width: data.width ? Number(data.width) : null,
        pressure: data.pressure ? Number(data.pressure) : null,
        capacity: data.capacity ? Number(data.capacity) : null,
        agentType: data.agentType || null,
        weight: data.weight ? Number(data.weight) : null
      };
      
    case 'HYDRANT':
      return {
        ...baseSpecs,
        height: data.height ? Number(data.height) : null,
        width: data.width ? Number(data.width) : null,
        flowRate: data.flowRate ? Number(data.flowRate) : null,
        pressure: data.pressure ? Number(data.pressure) : null,
        valveType: data.valveType || null,
        hoseLength: data.hoseLength ? Number(data.hoseLength) : null,
        material: data.material || null
      };
      
    case 'CCTV':
      return {
        ...baseSpecs,
        resolution: data.resolution || null,
        lens: data.lens || null,
        nightVision: Boolean(data.nightVision),
        power: data.power || null,
        connectivity: data.connectivity || null,
        pan: Boolean(data.pan),
        tilt: Boolean(data.tilt),
        storageCapacity: data.storageCapacity || null
      };
      
    case 'FIRE_ALARM':
      return {
        ...baseSpecs,
        sensorType: data.sensorType || null,
        power: data.power || null,
        coverageArea: data.coverageArea ? Number(data.coverageArea) : null,
        soundLevel: data.soundLevel ? Number(data.soundLevel) : null,
        batteryBackup: Boolean(data.batteryBackup),
        connectivity: data.connectivity || null
      };
      
    case 'ACCESS_DOOR':
      return {
        ...baseSpecs,
        material: data.material || null,
        lockType: data.lockType || null,
        width: data.width ? Number(data.width) : null,
        height: data.height ? Number(data.height) : null,
        openingSpeed: data.openingSpeed ? Number(data.openingSpeed) : null
      };
      
    case 'PATROL_GUARD':
      return {
        ...baseSpecs,
        deviceType: data.deviceType || null,
        batteryLife: data.batteryLife || null,
        connectivity: data.connectivity || null,
        patrolInterval: data.patrolInterval ? Number(data.patrolInterval) : null,
        firmwareVersion: data.firmwareVersion || null
      };
      
    default:
      return baseSpecs;
  }
}

/**
 * Prepares product data for Firebase import
 * @param data - Raw product data from CSV
 * @returns Product object ready for Firebase
 */
export function prepareProductForImport(data: Record<string, any>): Omit<Product, 'id'> {
  const productType = data.productType as ProductType;
  
  return {
    productNumber: data.productNumber ? Number(data.productNumber) : 0,
    name: data.name || '',
    productType: productType,
    specs: buildProductSpecs(data, productType),
    source: data.source || 'IMPORT',
    maintenanceInterval: data.maintenanceInterval ? Number(data.maintenanceInterval) : 30,
    imageUrl: data.imageUrl || '',
    contract: null, // New imports don't have contracts
    createdAt: Timestamp.now(),
    createdBy: null, // Will be set by import function
    updatedAt: Timestamp.now(),
    updatedBy: null // Will be set by import function
  };
}

/**
 * Validates that required fields are present for a product
 * @param data - Product data to validate
 * @returns Array of missing required fields
 */
export function getMissingRequiredFields(data: Record<string, any>): string[] {
  const required = ['productNumber', 'name', 'productType'];
  const missing: string[] = [];
  
  required.forEach(field => {
    if (!data[field] || data[field].toString().trim() === '') {
      missing.push(field);
    }
  });
  
  return missing;
}

/**
 * Sanitizes product data by removing invalid characters
 * @param data - Raw product data
 * @returns Sanitized product data
 */
export function sanitizeProductData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // Remove any non-printable characters and trim
      sanitized[key] = value.replace(/[\x00-\x1F\x7F]/g, '').trim();
    } else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
}