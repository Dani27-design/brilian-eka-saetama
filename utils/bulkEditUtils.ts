import { Product, ProductType, ProductSpecs } from "@/types/product";
import { Timestamp } from "firebase/firestore";

export interface FieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  category: 'product' | 'baseSpecs' | 'specificSpecs';
  options?: string[];
  placeholder?: string;
  unit?: string;
}

export interface FieldCompatibility {
  availableFields: FieldDefinition[];
  incompatibleFields: string[];
  productTypes: ProductType[];
}

/**
 * All possible field definitions for bulk editing
 */
export const ALL_FIELD_DEFINITIONS: FieldDefinition[] = [
  // Product Level Fields
  {
    key: 'name',
    label: 'Product Name',
    type: 'text',
    category: 'product',
    placeholder: 'Enter product name'
  },
  {
    key: 'productNumber',
    label: 'Product Number',
    type: 'number',
    category: 'product',
    placeholder: 'Enter product number'
  },
  {
    key: 'productType',
    label: 'Product Type',
    type: 'select',
    category: 'product',
    options: ['APAR', 'HYDRANT', 'CCTV', 'FIRE_ALARM', 'ACCESS_DOOR', 'PATROL_GUARD']
  },
  {
    key: 'source',
    label: 'Source/Vendor',
    type: 'text',
    category: 'product',
    placeholder: 'e.g., VENDOR ABC, INTERNAL'
  },
  {
    key: 'maintenanceInterval',
    label: 'Maintenance Interval',
    type: 'number',
    category: 'product',
    placeholder: 'Enter interval',
    unit: 'days'
  },
  {
    key: 'imageUrl',
    label: 'Image URL',
    type: 'text',
    category: 'product',
    placeholder: 'Enter image URL'
  },

  // Base Specs Fields (Available for all product types)
  {
    key: 'brand',
    label: 'Brand',
    type: 'text',
    category: 'baseSpecs',
    placeholder: 'e.g., ABC Fire'
  },
  {
    key: 'brandType',
    label: 'Brand Type/Model',
    type: 'text',
    category: 'baseSpecs',
    placeholder: 'e.g., Model XYZ'
  },
  {
    key: 'manufactureDate',
    label: 'Manufacture Date',
    type: 'date',
    category: 'baseSpecs'
  },
  {
    key: 'installationDate',
    label: 'Installation Date',
    type: 'date',
    category: 'baseSpecs'
  },
  {
    key: 'expirationDate',
    label: 'Expiration Date',
    type: 'date',
    category: 'baseSpecs'
  },
  {
    key: 'serialNumber',
    label: 'Serial Number',
    type: 'text',
    category: 'baseSpecs',
    placeholder: 'Enter serial number'
  },

  // APAR Specific Fields
  {
    key: 'height',
    label: 'Height',
    type: 'number',
    category: 'specificSpecs',
    unit: 'cm',
    placeholder: 'Enter height'
  },
  {
    key: 'width',
    label: 'Width',
    type: 'number',
    category: 'specificSpecs',
    unit: 'cm',
    placeholder: 'Enter width'
  },
  {
    key: 'pressure',
    label: 'Pressure',
    type: 'number',
    category: 'specificSpecs',
    unit: 'bar',
    placeholder: 'Enter pressure'
  },
  {
    key: 'capacity',
    label: 'Capacity',
    type: 'number',
    category: 'specificSpecs',
    unit: 'kg',
    placeholder: 'Enter capacity'
  },
  {
    key: 'agentType',
    label: 'Agent Type',
    type: 'text',
    category: 'specificSpecs',
    placeholder: 'e.g., Powder, CO2'
  },
  {
    key: 'weight',
    label: 'Weight',
    type: 'number',
    category: 'specificSpecs',
    unit: 'kg',
    placeholder: 'Enter total weight'
  },

  // HYDRANT Specific Fields
  {
    key: 'flowRate',
    label: 'Flow Rate',
    type: 'number',
    category: 'specificSpecs',
    unit: 'L/min',
    placeholder: 'Enter flow rate'
  },
  {
    key: 'valveType',
    label: 'Valve Type',
    type: 'text',
    category: 'specificSpecs',
    placeholder: 'Enter valve type'
  },
  {
    key: 'hoseLength',
    label: 'Hose Length',
    type: 'number',
    category: 'specificSpecs',
    unit: 'm',
    placeholder: 'Enter hose length'
  },
  {
    key: 'material',
    label: 'Material',
    type: 'text',
    category: 'specificSpecs',
    placeholder: 'Enter material type'
  },

  // CCTV Specific Fields
  {
    key: 'resolution',
    label: 'Resolution',
    type: 'text',
    category: 'specificSpecs',
    placeholder: 'e.g., 1080p, 4K'
  },
  {
    key: 'lens',
    label: 'Lens',
    type: 'text',
    category: 'specificSpecs',
    placeholder: 'Enter lens specifications'
  },
  {
    key: 'nightVision',
    label: 'Night Vision',
    type: 'boolean',
    category: 'specificSpecs'
  },
  {
    key: 'power',
    label: 'Power',
    type: 'text',
    category: 'specificSpecs',
    placeholder: 'e.g., 12V DC'
  },
  {
    key: 'connectivity',
    label: 'Connectivity',
    type: 'text',
    category: 'specificSpecs',
    placeholder: 'e.g., Wi-Fi, Ethernet'
  },
  {
    key: 'pan',
    label: 'Pan',
    type: 'boolean',
    category: 'specificSpecs'
  },
  {
    key: 'tilt',
    label: 'Tilt',
    type: 'boolean',
    category: 'specificSpecs'
  },
  {
    key: 'storageCapacity',
    label: 'Storage Capacity',
    type: 'text',
    category: 'specificSpecs',
    placeholder: 'e.g., 1TB, 64GB'
  },

  // FIRE_ALARM Specific Fields
  {
    key: 'sensorType',
    label: 'Sensor Type',
    type: 'text',
    category: 'specificSpecs',
    placeholder: 'e.g., Smoke, Heat'
  },
  {
    key: 'coverageArea',
    label: 'Coverage Area',
    type: 'number',
    category: 'specificSpecs',
    unit: 'm²',
    placeholder: 'Enter coverage area'
  },
  {
    key: 'soundLevel',
    label: 'Sound Level',
    type: 'number',
    category: 'specificSpecs',
    unit: 'dB',
    placeholder: 'Enter sound level'
  },
  {
    key: 'batteryBackup',
    label: 'Battery Backup',
    type: 'boolean',
    category: 'specificSpecs'
  },

  // ACCESS_DOOR Specific Fields
  {
    key: 'lockType',
    label: 'Lock Type',
    type: 'text',
    category: 'specificSpecs',
    placeholder: 'Enter lock type'
  },
  {
    key: 'openingSpeed',
    label: 'Opening Speed',
    type: 'number',
    category: 'specificSpecs',
    unit: 'cm/s',
    placeholder: 'Enter opening speed'
  },

  // PATROL_GUARD Specific Fields
  {
    key: 'deviceType',
    label: 'Device Type',
    type: 'text',
    category: 'specificSpecs',
    placeholder: 'Enter device type'
  },
  {
    key: 'batteryLife',
    label: 'Battery Life',
    type: 'text',
    category: 'specificSpecs',
    placeholder: 'e.g., 8 hours'
  },
  {
    key: 'patrolInterval',
    label: 'Patrol Interval',
    type: 'number',
    category: 'specificSpecs',
    unit: 'minutes',
    placeholder: 'Enter patrol interval'
  },
  {
    key: 'firmwareVersion',
    label: 'Firmware Version',
    type: 'text',
    category: 'specificSpecs',
    placeholder: 'e.g., v1.2.3'
  }
];

/**
 * Product type specific field mappings
 */
const PRODUCT_TYPE_FIELDS: Record<ProductType, string[]> = {
  APAR: ['height', 'width', 'pressure', 'capacity', 'agentType', 'weight'],
  HYDRANT: ['height', 'width', 'flowRate', 'pressure', 'valveType', 'hoseLength', 'material'],
  CCTV: ['resolution', 'lens', 'nightVision', 'power', 'connectivity', 'pan', 'tilt', 'storageCapacity'],
  FIRE_ALARM: ['sensorType', 'power', 'coverageArea', 'soundLevel', 'batteryBackup', 'connectivity'],
  ACCESS_DOOR: ['material', 'lockType', 'width', 'height', 'openingSpeed'],
  PATROL_GUARD: ['deviceType', 'batteryLife', 'connectivity', 'patrolInterval', 'firmwareVersion']
};

/**
 * Analyzes selected products and returns compatible fields for bulk editing
 */
export function analyzeFieldCompatibility(products: Product[]): FieldCompatibility {
  if (products.length === 0) {
    return {
      availableFields: [],
      incompatibleFields: [],
      productTypes: []
    };
  }

  const productTypes = Array.from(new Set(products.map(p => p.productType)));
  const isSingleType = productTypes.length === 1;

  // Always available fields (product level + base specs)
  const alwaysAvailable = ALL_FIELD_DEFINITIONS.filter(
    field => field.category === 'product' || field.category === 'baseSpecs'
  );

  // Product-specific fields that are compatible across all selected products
  let compatibleSpecificFields: FieldDefinition[] = [];
  let incompatibleFields: string[] = [];

  if (isSingleType) {
    // If all products are the same type, include all their specific fields
    const productType = productTypes[0];
    const specificFieldKeys = PRODUCT_TYPE_FIELDS[productType] || [];
    
    compatibleSpecificFields = ALL_FIELD_DEFINITIONS.filter(
      field => field.category === 'specificSpecs' && specificFieldKeys.includes(field.key)
    );
  } else {
    // For mixed types, find common specific fields
    const allSpecificFields = ALL_FIELD_DEFINITIONS.filter(
      field => field.category === 'specificSpecs'
    );

    for (const field of allSpecificFields) {
      const isCompatibleWithAllTypes = productTypes.every(type => {
        const typeFields = PRODUCT_TYPE_FIELDS[type] || [];
        return typeFields.includes(field.key);
      });

      if (isCompatibleWithAllTypes) {
        compatibleSpecificFields.push(field);
      } else {
        incompatibleFields.push(field.key);
      }
    }
  }

  return {
    availableFields: [...alwaysAvailable, ...compatibleSpecificFields],
    incompatibleFields,
    productTypes
  };
}

/**
 * Converts form values to proper types for database updates
 */
export function convertFieldValue(field: FieldDefinition, value: any): any {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  switch (field.type) {
    case 'number':
      return Number(value);
    case 'boolean':
      return Boolean(value);
    case 'date':
      // Convert date string to Timestamp
      return value instanceof Date ? Timestamp.fromDate(value) : Timestamp.fromDate(new Date(value));
    case 'text':
    case 'select':
    default:
      return String(value);
  }
}

/**
 * Organizes fields by category for UI display
 */
export function organizeFieldsByCategory(fields: FieldDefinition[]) {
  return {
    product: fields.filter(f => f.category === 'product'),
    baseSpecs: fields.filter(f => f.category === 'baseSpecs'),
    specificSpecs: fields.filter(f => f.category === 'specificSpecs')
  };
}

/**
 * Gets the display name for a field category
 */
export function getCategoryDisplayName(category: string): string {
  switch (category) {
    case 'product':
      return 'Product Information';
    case 'baseSpecs':
      return 'Basic Specifications';
    case 'specificSpecs':
      return 'Product-Specific Specifications';
    default:
      return category;
  }
}