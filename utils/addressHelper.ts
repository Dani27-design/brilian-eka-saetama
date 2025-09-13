import { CustomerAddress } from '@/types/customer';
import { validateCompleteIndonesianAddress, formatAddress, getCompleteAddressDisplay, getProvinceByName, getCityByName, normalizeAddressForStorage, normalizeAddressForDisplay, provinceHasCityData } from './indonesianRegions';
import { ValidationMessages } from './validationMessages';

/**
 * Validate complete customer address
 */
export function validateCustomerAddress(address: Partial<CustomerAddress>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  
  // Required fields
  if (!address.street?.trim()) {
    errors.street = ValidationMessages.ADDRESS_STREET_REQUIRED;
  }
  
  if (!address.village?.trim()) {
    errors.village = ValidationMessages.ADDRESS_VILLAGE_REQUIRED;
  }
  
  if (!address.district?.trim()) {
    errors.district = ValidationMessages.ADDRESS_DISTRICT_REQUIRED;
  }
  
  if (!address.city?.trim()) {
    errors.city = ValidationMessages.ADDRESS_CITY_REQUIRED;
  }
  
  if (!address.province?.trim()) {
    errors.province = ValidationMessages.ADDRESS_PROVINCE_REQUIRED;
  }
  
  // Validate Indonesian administrative regions with improved logic
  if (address.province && address.city) {
    const regionValidation = validateCompleteIndonesianAddress({
      province: address.province,
      city: address.city,
      district: address.district,
      village: address.village
    });
    
    // Add errors to validation results
    if (!regionValidation.isValid && regionValidation.errors.length > 0) {
      errors.region = regionValidation.errors.join(', ');
    }
    
    // Log warnings but don't fail validation
    if (regionValidation.warnings.length > 0) {
      console.info('Address validation warnings:', regionValidation.warnings.join(', '));
    }
  }
  
  // Validate postal code format (Indonesian format: 5 digits)
  if (address.postalCode && !/^\d{5}$/.test(address.postalCode)) {
    errors.postalCode = ValidationMessages.INVALID_POSTAL_CODE_FORMAT;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Format address for display with proper Indonesian formatting
 */
export function formatCustomerAddress(address: CustomerAddress, options?: {
  includePostalCode?: boolean;
  separator?: string;
}): string {
  const { includePostalCode = true, separator = ', ' } = options || {};
  
  const parts: string[] = [];
  
  if (address.street) parts.push(address.street);
  if (address.village) parts.push(address.village);
  if (address.district) parts.push(address.district);
  if (address.city) parts.push(address.city);
  if (address.province) parts.push(address.province);
  if (includePostalCode && address.postalCode) parts.push(address.postalCode);
  
  return parts.join(separator);
}

/**
 * Format address for single line display (truncated)
 */
export function formatAddressSingleLine(address: CustomerAddress, maxLength = 50): string {
  const formatted = formatCustomerAddress(address, { separator: ', ' });
  
  if (formatted.length <= maxLength) {
    return formatted;
  }
  
  return formatted.substring(0, maxLength - 3) + '...';
}

/**
 * Create address object from form data
 * Normalizes data for storage (converts names to IDs where possible)
 */
export function createAddressFromForm(formData: {
  street: string;
  village: string;
  district: string;
  city: string;
  province: string;
  postalCode?: string;
}): CustomerAddress {
  const rawAddress = {
    street: formData.street.trim(),
    village: formData.village.trim(),
    district: formData.district.trim(),
    city: formData.city.trim(),
    province: formData.province.trim(),
    postalCode: formData.postalCode?.trim() || undefined
  };
  
  // Normalize for storage (convert names to IDs where possible)
  const normalizedAddress = normalizeAddressForStorage({
    province: rawAddress.province,
    city: rawAddress.city,
    district: rawAddress.district,
    village: rawAddress.village
  });
  
  return {
    ...rawAddress,
    province: normalizedAddress.province,
    city: normalizedAddress.city
  };
}

/**
 * Parse address from CSV import
 * Converts province and city names to IDs for validation compatibility
 */
export function parseAddressFromCSV(row: any): Partial<CustomerAddress> {
  // Extract raw values from CSV
  const provinceName = row.province || row.provinsi || '';
  const cityName = row.city || row.kota || row.kabupaten || '';
  
  const rawAddress = {
    street: row.street || row.alamat || '',
    village: row.village || row.kelurahan || row.desa || '',
    district: row.district || row.kecamatan || '',
    city: cityName,
    province: provinceName,
    postalCode: row.postalCode || row.kodePos || ''
  };
  
  // Normalize for storage (convert names to IDs where possible)
  const normalizedAddress = normalizeAddressForStorage({
    province: provinceName,
    city: cityName,
    district: rawAddress.district,
    village: rawAddress.village
  });
  
  return {
    ...rawAddress,
    province: normalizedAddress.province,
    city: normalizedAddress.city
  };
}

/**
 * Compare two addresses for similarity (for duplicate detection)
 */
export function compareAddresses(addr1: CustomerAddress, addr2: CustomerAddress): {
  isSimilar: boolean;
  score: number;
} {
  let score = 0;
  let totalFields = 0;
  
  const fields: (keyof CustomerAddress)[] = ['street', 'village', 'district', 'city', 'province'];
  
  for (const field of fields) {
    totalFields++;
    const fieldVal1 = addr1[field];
    const fieldVal2 = addr2[field];
    
    // Skip if either field is not a string (e.g., coordinates)
    if (typeof fieldVal1 !== 'string' || typeof fieldVal2 !== 'string') {
      continue;
    }
    
    const val1 = fieldVal1?.toLowerCase().trim();
    const val2 = fieldVal2?.toLowerCase().trim();
    
    if (val1 === val2) {
      score++;
    } else if (val1 && val2 && (val1.includes(val2) || val2.includes(val1))) {
      score += 0.5;
    }
  }
  
  const similarityScore = score / totalFields;
  
  return {
    isSimilar: similarityScore >= 0.8, // 80% similarity threshold
    score: similarityScore
  };
}

/**
 * Get address suggestions for autocomplete
 */
export function getAddressSuggestions(
  field: keyof CustomerAddress,
  value: string,
  context?: Partial<CustomerAddress>
): string[] {
  // This would typically connect to a geocoding service
  // For now, return empty array (can be enhanced later)
  return [];
}

/**
 * Validate coordinates
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  // Indonesia coordinate bounds (approximate)
  const indonesiaBounds = {
    north: 6,
    south: -11,
    east: 141,
    west: 95
  };
  
  return (
    lat >= indonesiaBounds.south &&
    lat <= indonesiaBounds.north &&
    lng >= indonesiaBounds.west &&
    lng <= indonesiaBounds.east
  );
}