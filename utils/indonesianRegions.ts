import { Province, City, District, Village } from '@/types/indonesianRegions';
import { ValidationMessages } from './validationMessages';

// Import static data
import provincesData from '@/data/indonesian-provinces.json';
import citiesData from '@/data/indonesian-cities.json';
import businessFieldsData from '@/data/business-fields.json';

// Import districts and villages data (complete dataset)
let districtsData: District[] = [];
let villagesData: Village[] = [];
let districtSearchIndex: any = {};
let villageSearchIndex: any = {};

// Try to load complete districts data first, fallback to sample
try {
  districtsData = require('@/data/indonesian-districts-complete.json');
  console.info(`Loaded ${districtsData.length} complete districts`);
} catch (error) {
  try {
    districtsData = require('@/data/indonesian-districts-sample.json');
    console.warn('Using sample districts data, complete data not found');
  } catch (sampleError) {
    console.warn('No districts data found, district functions will return empty results');
  }
}

// Try to load complete villages data first, fallback to sample
try {
  villagesData = require('@/data/indonesian-villages-complete.json');
  console.info(`Loaded ${villagesData.length} complete villages`);
} catch (error) {
  try {
    villagesData = require('@/data/indonesian-villages-partial.json');
    console.warn('Using partial villages data, complete data not found');
  } catch (partialError) {
    try {
      villagesData = require('@/data/indonesian-villages-sample.json');
      console.warn('Using sample villages data, complete data not found');
    } catch (sampleError) {
      console.warn('No villages data found, village functions will return empty results');
    }
  }
}

// Load search indices for performance
try {
  districtSearchIndex = require('@/data/indonesian-districts-search-index.json');
} catch (error) {
  console.info('District search index not found, will use linear search');
}

try {
  villageSearchIndex = require('@/data/indonesian-villages-search-index.json');
} catch (error) {
  console.info('Village search index not found, will use linear search');
}

/**
 * Get all provinces
 */
export function getProvinces(): Province[] {
  return provincesData;
}

/**
 * Check if a province has city data available
 * Supports both ID and name input
 */
export function provinceHasCityData(provinceIdOrName: string): boolean {
  if (!provinceIdOrName?.trim()) return false;
  
  let provinceId = provinceIdOrName;
  
  // If it's a name, convert to ID
  if (isNaN(Number(provinceIdOrName))) {
    const province = getProvinceByName(provinceIdOrName);
    if (!province) {
      console.warn(`Province not found for checking city data: ${provinceIdOrName}`);
      return false;
    }
    provinceId = province.id;
  }
  
  const cities = getCitiesByProvince(provinceId);
  const hasData = cities.length > 0;
  
  if (!hasData) {
    console.info(`No city data available for province ID: ${provinceId}`);
  }
  
  return hasData;
}

/**
 * Get provinces that have city data
 */
export function getProvincesWithCityData(): Set<string> {
  const provincesWithData = new Set<string>();
  citiesData.forEach((city: any) => {
    provincesWithData.add(city.provinceId);
  });
  return provincesWithData;
}

/**
 * Get cities by province ID
 */
export function getCitiesByProvince(provinceId: string): City[] {
  return citiesData.filter(city => city.provinceId === provinceId) as City[];
}

/**
 * Get province by ID
 */
export function getProvinceById(id: string): Province | undefined {
  return provincesData.find(province => province.id === id);
}

/**
 * Get city by ID
 */
export function getCityById(id: string): City | undefined {
  return citiesData.find(city => city.id === id) as City | undefined;
}

/**
 * Get province by name (case-insensitive with fuzzy matching)
 */
export function getProvinceByName(name: string): Province | undefined {
  if (!name?.trim()) return undefined;
  const normalizedName = name.toLowerCase().trim();
  
  // Try exact match first
  let province = provincesData.find(p => 
    p.name.toLowerCase() === normalizedName
  );
  
  if (province) return province;
  
  // Try fuzzy matching - contains or partial match
  province = provincesData.find(p => {
    const provinceName = p.name.toLowerCase();
    return provinceName.includes(normalizedName) || normalizedName.includes(provinceName);
  });
  
  return province;
}

/**
 * Get city by name (case-insensitive with fuzzy matching), optionally within a specific province
 */
export function getCityByName(name: string, provinceId?: string): City | undefined {
  if (!name?.trim()) return undefined;
  const normalizedName = name.toLowerCase().trim();
  
  let cities = citiesData as City[];
  
  // Filter by province if specified
  if (provinceId) {
    cities = cities.filter(city => city.provinceId === provinceId);
  }
  
  // Try exact match first
  let city = cities.find(c => 
    c.name.toLowerCase() === normalizedName
  );
  
  if (city) return city;
  
  // Try fuzzy matching - contains or partial match
  city = cities.find(c => {
    const cityName = c.name.toLowerCase();
    return cityName.includes(normalizedName) || normalizedName.includes(cityName);
  });
  
  return city;
}

/**
 * Get business fields
 */
export function getBusinessFields() {
  return businessFieldsData;
}

/**
 * Format address for display
 */
export function formatAddress(address: {
  street?: string;
  village?: string;
  district?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}): string {
  const parts: string[] = [];
  
  if (address.street) parts.push(address.street);
  if (address.village) parts.push(address.village);
  if (address.district) parts.push(address.district);
  if (address.city) parts.push(address.city);
  if (address.province) parts.push(address.province);
  if (address.postalCode) parts.push(address.postalCode);
  
  return parts.join(', ');
}

/**
 * Validate Indonesian address
 */
export function validateIndonesianAddress(address: {
  province: string;
  city: string;
  district?: string;
  village?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check if province exists
  const province = getProvinceById(address.province);
  if (!province) {
    errors.push(ValidationMessages.INVALID_PROVINCE);
  }
  
  // Check if city exists and belongs to province
  const city = getCityById(address.city);
  if (!city) {
    errors.push(ValidationMessages.INVALID_CITY);
  } else if (city.provinceId !== address.province) {
    errors.push(ValidationMessages.CITY_NOT_IN_PROVINCE);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Search regions by name
 */
export function searchProvinces(query: string): Province[] {
  const lowercaseQuery = query.toLowerCase();
  return provincesData.filter(province => 
    province.name.toLowerCase().includes(lowercaseQuery)
  );
}

export function searchCities(query: string, provinceId?: string): City[] {
  const lowercaseQuery = query.toLowerCase();
  let cities = citiesData.filter(city => 
    city.name.toLowerCase().includes(lowercaseQuery)
  );
  
  if (provinceId) {
    cities = cities.filter(city => city.provinceId === provinceId);
  }
  
  return cities as City[];
}

/**
 * Get complete address hierarchy
 */
export function getAddressHierarchy(address: {
  province: string;
  city: string;
  district?: string;
  village?: string;
}) {
  const province = getProvinceById(address.province);
  const city = getCityById(address.city);
  
  return {
    province: province?.name || '',
    city: city?.name || '',
    district: address.district || '',
    village: address.village || ''
  };
}

/**
 * Customer type options
 */
export const customerTypeOptions = [
  { value: 'individual', label: 'Individual' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'government', label: 'Government' },
  { value: 'nonprofit', label: 'Non-profit' }
];

/**
 * Get customer type display name
 */
export function getCustomerTypeDisplay(type: string): string {
  const option = customerTypeOptions.find(opt => opt.value === type);
  return option?.label || type;
}

// ===== DISTRICT FUNCTIONS =====

/**
 * Get districts by city ID
 */
export function getDistrictsByCity(cityId: string): District[] {
  return districtsData.filter(district => district.cityId === cityId);
}

/**
 * Get district by ID
 */
export function getDistrictById(id: string): District | undefined {
  return districtsData.find(district => district.id === id);
}

/**
 * Get district by name (case-insensitive), optionally within a specific city
 */
export function getDistrictByName(name: string, cityId?: string): District | undefined {
  if (!name?.trim()) return undefined;
  const normalizedName = name.toLowerCase().trim();
  
  let districts = districtsData;
  
  // Filter by city if specified
  if (cityId) {
    districts = districts.filter(district => district.cityId === cityId);
  }
  
  return districts.find(district => 
    district.name.toLowerCase() === normalizedName
  );
}

/**
 * Check if a city has district data available
 */
export function cityHasDistrictData(cityId: string): boolean {
  const districts = getDistrictsByCity(cityId);
  return districts.length > 0;
}

/**
 * Search districts by name with performance optimization
 */
export function searchDistricts(query: string, cityId?: string, limit = 50): District[] {
  if (!query?.trim()) return [];
  
  const lowercaseQuery = query.toLowerCase().trim();
  let results: District[] = [];
  
  // Use search index if available for better performance
  if (Object.keys(districtSearchIndex).length > 0) {
    const indices = new Set<number>();
    
    // Search for exact matches and partial matches
    Object.keys(districtSearchIndex).forEach(term => {
      if (term.includes(lowercaseQuery) || lowercaseQuery.includes(term)) {
        districtSearchIndex[term].forEach((idx: number) => indices.add(idx));
      }
    });
    
    results = Array.from(indices)
      .map(idx => districtsData[idx])
      .filter(district => district && district.name.toLowerCase().includes(lowercaseQuery));
  } else {
    // Fallback to linear search
    results = districtsData.filter(district => 
      district.name.toLowerCase().includes(lowercaseQuery)
    );
  }
  
  // Filter by city if specified
  if (cityId) {
    results = results.filter(district => district.cityId === cityId);
  }
  
  // Limit results for performance
  return results.slice(0, limit);
}

// ===== VILLAGE FUNCTIONS =====

/**
 * Get villages by district ID
 */
export function getVillagesByDistrict(districtId: string): Village[] {
  return villagesData.filter(village => village.districtId === districtId);
}

/**
 * Get village by ID
 */
export function getVillageById(id: string): Village | undefined {
  return villagesData.find(village => village.id === id);
}

/**
 * Get village by name (case-insensitive), optionally within a specific district
 */
export function getVillageByName(name: string, districtId?: string): Village | undefined {
  if (!name?.trim()) return undefined;
  const normalizedName = name.toLowerCase().trim();
  
  let villages = villagesData;
  
  // Filter by district if specified
  if (districtId) {
    villages = villages.filter(village => village.districtId === districtId);
  }
  
  return villages.find(village => 
    village.name.toLowerCase() === normalizedName
  );
}

/**
 * Check if a district has village data available
 */
export function districtHasVillageData(districtId: string): boolean {
  const villages = getVillagesByDistrict(districtId);
  return villages.length > 0;
}

/**
 * Search villages by name with performance optimization
 */
export function searchVillages(query: string, districtId?: string, limit = 50): Village[] {
  if (!query?.trim()) return [];
  
  const lowercaseQuery = query.toLowerCase().trim();
  let results: Village[] = [];
  
  // Use search index if available for better performance
  if (Object.keys(villageSearchIndex).length > 0) {
    const indices = new Set<number>();
    
    // Search for exact matches and partial matches
    Object.keys(villageSearchIndex).forEach(term => {
      if (term.includes(lowercaseQuery) || lowercaseQuery.includes(term)) {
        villageSearchIndex[term].forEach((idx: number) => indices.add(idx));
      }
    });
    
    results = Array.from(indices)
      .map(idx => villagesData[idx])
      .filter(village => village && village.name.toLowerCase().includes(lowercaseQuery));
  } else {
    // Fallback to linear search
    results = villagesData.filter(village => 
      village.name.toLowerCase().includes(lowercaseQuery)
    );
  }
  
  // Filter by district if specified
  if (districtId) {
    results = results.filter(village => village.districtId === districtId);
  }
  
  // Limit results for performance
  return results.slice(0, limit);
}

// ===== ADDRESS NORMALIZATION FUNCTIONS =====

/**
 * Normalize address data - convert names to IDs where possible for storage
 */
export function normalizeAddressForStorage(address: {
  province: string;
  city: string;
  district?: string;
  village?: string;
}) {
  const normalized = { ...address };
  
  // Convert province name to ID if it's a name
  if (address.province && isNaN(Number(address.province))) {
    const province = getProvinceByName(address.province);
    if (province) {
      normalized.province = province.id;
    }
  }
  
  // Convert city name to ID if it's a name
  if (address.city && isNaN(Number(address.city))) {
    const city = getCityByName(address.city, normalized.province);
    if (city) {
      normalized.city = city.id;
    }
  }
  
  return normalized;
}

/**
 * Normalize address data - convert IDs to names for display
 */
export function normalizeAddressForDisplay(address: {
  province: string;
  city: string;
  district?: string;
  village?: string;
}) {
  const normalized = { ...address };
  
  // Convert province ID to name if it's an ID
  if (address.province && !isNaN(Number(address.province))) {
    const province = getProvinceById(address.province);
    if (province) {
      normalized.province = province.name;
    }
  }
  
  // Convert city ID to name if it's an ID
  if (address.city && !isNaN(Number(address.city))) {
    const city = getCityById(address.city);
    if (city) {
      normalized.city = city.name;
    }
  }
  
  return normalized;
}

// ===== PERFORMANCE AND LAZY LOADING FUNCTIONS =====

/**
 * Get districts for a city with lazy loading
 */
export function getDistrictsLazy(cityId: string, offset = 0, limit = 100): {
  districts: District[];
  hasMore: boolean;
  total: number;
} {
  const allDistricts = getDistrictsByCity(cityId);
  const paginatedDistricts = allDistricts.slice(offset, offset + limit);
  
  return {
    districts: paginatedDistricts,
    hasMore: offset + limit < allDistricts.length,
    total: allDistricts.length
  };
}

/**
 * Get villages for a district with lazy loading
 */
export function getVillagesLazy(districtId: string, offset = 0, limit = 100): {
  villages: Village[];
  hasMore: boolean;
  total: number;
} {
  const allVillages = getVillagesByDistrict(districtId);
  const paginatedVillages = allVillages.slice(offset, offset + limit);
  
  return {
    villages: paginatedVillages,
    hasMore: offset + limit < allVillages.length,
    total: allVillages.length
  };
}

/**
 * Get autocomplete suggestions for districts
 */
export function getDistrictSuggestions(query: string, cityId?: string, limit = 10): District[] {
  if (!query?.trim() || query.length < 2) return [];
  
  return searchDistricts(query, cityId, limit);
}

/**
 * Get autocomplete suggestions for villages
 */
export function getVillageSuggestions(query: string, districtId?: string, limit = 10): Village[] {
  if (!query?.trim() || query.length < 2) return [];
  
  return searchVillages(query, districtId, limit);
}

// ===== COMPLETE HIERARCHY FUNCTIONS =====

/**
 * Get complete Indonesian regional hierarchy statistics
 */
export function getRegionalStatistics() {
  const provincesWithCityData = getProvincesWithCityData();
  
  // Determine data completeness levels
  const isDistrictsComplete = districtsData.length >= 7000; // Near complete
  const isVillagesComplete = villagesData.length >= 80000; // Near complete
  const isVillagesPartial = villagesData.length >= 1000; // Substantial sample
  
  return {
    provinces: provincesData.length,
    cities: citiesData.length,
    districts: districtsData.length,
    villages: villagesData.length,
    provincesWithCityData: provincesWithCityData.size,
    provincesWithoutCityData: provincesData.length - provincesWithCityData.size,
    hasCompleteData: {
      provinces: true,
      cities: true,
      districts: isDistrictsComplete,
      villages: isVillagesComplete
    },
    coverageStats: {
      provinceCoverage: '100%',
      cityCoverage: `${Math.round((provincesWithCityData.size / provincesData.length) * 100)}%`,
      districtCoverage: isDistrictsComplete 
        ? `${Math.round((districtsData.length / 7288) * 100)}% (${districtsData.length}/7,288)`
        : districtsData.length > 0 ? 'Sample data' : 'Not available',
      villageCoverage: isVillagesComplete 
        ? `${Math.round((villagesData.length / 84210) * 100)}% (${villagesData.length}/84,210)`
        : isVillagesPartial 
        ? `Partial (${villagesData.length} villages)`
        : villagesData.length > 0 ? 'Sample data' : 'Not available'
    },
    searchIndices: {
      districts: Object.keys(districtSearchIndex).length > 0,
      villages: Object.keys(villageSearchIndex).length > 0
    },
    dataQuality: {
      level: isDistrictsComplete && isVillagesComplete ? 'complete' : 
             isDistrictsComplete && isVillagesPartial ? 'near-complete' : 
             'partial',
      description: isDistrictsComplete && isVillagesComplete ? 'Complete administrative data' :
                   isDistrictsComplete && isVillagesPartial ? 'Complete districts, substantial villages data' :
                   'Partial administrative data'
    }
  };
}

/**
 * Get all available data for a complete address hierarchy
 */
export function getCompleteAddressData() {
  return {
    provinces: provincesData,
    cities: citiesData,
    districts: districtsData,
    villages: villagesData
  };
}

/**
 * Validate complete Indonesian address with improved handling
 */
export function validateCompleteIndonesianAddress(address: {
  province: string;
  city: string;
  district?: string;
  village?: string;
}): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!address.province || !address.city) {
    errors.push('Province and city are required');
    return { isValid: false, errors, warnings };
  }
  
  // Normalize address for validation
  const normalizedAddress = normalizeAddressForStorage(address);
  
  // Check if province exists (try both ID and name)
  let province: Province | null = null;
  if (!isNaN(Number(address.province))) {
    province = getProvinceById(address.province) || null;
  } else {
    province = getProvinceByName(address.province) || null;
  }
  
  if (!province) {
    errors.push(ValidationMessages.INVALID_PROVINCE);
    return { isValid: false, errors, warnings };
  }
  
  // Check if city exists and belongs to province (try both ID and name)
  let city: City | null = null;
  if (!isNaN(Number(address.city))) {
    city = getCityById(address.city) || null;
  } else {
    city = getCityByName(address.city, province.id) || null;
  }
  
  if (!city) {
    // Check if we have city data for this province
    const hasCityData = provinceHasCityData(province.id);
    if (hasCityData) {
      errors.push(ValidationMessages.INVALID_CITY);
    } else {
      warnings.push(`City data not available for ${province.name}. Manual entry accepted.`);
    }
  } else if (city.provinceId !== province.id) {
    errors.push(ValidationMessages.CITY_NOT_IN_PROVINCE);
  }
  
  // Check district if provided (only check if we have sample data)
  if (address.district && districtsData.length > 0) {
    const district = getDistrictById(address.district);
    if (!district) {
      warnings.push('District not found in our sample database');
    } else if (city && district.cityId !== city.id) {
      warnings.push('District may not belong to the specified city (limited data)');
    }
  }
  
  // Check village if provided (only check if we have sample data)
  if (address.village && address.district && villagesData.length > 0) {
    const village = getVillageById(address.village);
    if (!village) {
      warnings.push('Village not found in our sample database');
    } else if (village.districtId !== address.district) {
      warnings.push('Village may not belong to the specified district (limited data)');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get complete address display names
 */
export function getCompleteAddressDisplay(address: {
  province: string;
  city: string;
  district?: string;
  village?: string;
}) {
  const province = getProvinceById(address.province);
  const city = getCityById(address.city);
  const district = address.district ? getDistrictById(address.district) : null;
  const village = address.village ? getVillageById(address.village) : null;
  
  return {
    province: province?.name || address.province,
    city: city?.name || address.city,
    district: district?.name || address.district || '',
    village: village?.name || address.village || '',
    cityType: city?.type || 'unknown'
  };
}