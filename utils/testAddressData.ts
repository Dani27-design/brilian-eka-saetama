/**
 * Test utility for verifying address data handling
 * This simulates the customer data structure you showed
 */

import { validateCustomerAddress, createAddressFromForm, parseAddressFromCSV } from './addressHelper';
import { normalizeAddressForDisplay, normalizeAddressForStorage, getRegionalStatistics } from './indonesianRegions';
import { CustomerAddress } from '@/types/customer';

/**
 * Sample customer address data (as stored in Firestore)
 */
export const sampleFirestoreData = {
  address: {
    city: "3171",                    // ID stored
    district: "Kebayoran Baru",      // Name stored
    postalCode: "12190",
    province: "31",                  // ID stored  
    street: "Jl Sudirman No 123 RT 001 RW 002",
    village: "Kebayoran Baru"        // Name stored
  }
};

/**
 * Sample customer data from different provinces to test coverage
 */
export const testCases = [
  {
    name: "Jakarta Customer (Complete Data)",
    address: {
      province: "31",              // DKI Jakarta (ID)
      city: "3171",               // Jakarta Selatan (ID)
      district: "Kebayoran Baru",
      village: "Kebayoran Baru",
      street: "Jl Sudirman No 123",
      postalCode: "12190"
    }
  },
  {
    name: "West Java Customer (Complete Data)",
    address: {
      province: "32",              // Jawa Barat (ID)
      city: "3273",               // Bandung (ID)
      district: "Sukasari",
      village: "Geger Kalong",
      street: "Jl Asia Afrika No 456",
      postalCode: "40115"
    }
  },
  {
    name: "North Sumatra Customer (Limited Data)",
    address: {
      province: "12",              // Sumatera Utara (ID)
      city: "1275",               // Medan (ID)
      district: "Medan Baru",
      village: "Babura",
      street: "Jl Gatot Subroto No 789",
      postalCode: "20119"
    }
  },
  {
    name: "Form Input (Names)",
    address: {
      province: "DKI Jakarta",     // Name input
      city: "Jakarta Selatan",     // Name input
      district: "Kebayoran Baru",
      village: "Kebayoran Baru",
      street: "Jl Sudirman No 123",
      postalCode: "12190"
    }
  }
];

/**
 * Test address data handling
 */
export function testAddressHandling() {
  console.log('🧪 Testing Indonesian Address Data Handling');
  console.log('='.repeat(50));
  
  // Show regional statistics
  const stats = getRegionalStatistics();
  console.log('\n📊 Regional Data Coverage:');
  console.log('Provinces:', stats.provinces, '(100% coverage)');
  console.log('Cities:', stats.cities, `(${stats.coverageStats.cityCoverage} coverage)`);
  console.log('Districts:', stats.districts, '(sample data)');
  console.log('Villages:', stats.villages, '(sample data)');
  console.log('Provinces with city data:', stats.provincesWithCityData);
  
  console.log('\n🧪 Testing Address Normalization:');
  console.log('-'.repeat(30));
  
  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}`);
    
    // Test normalization for display
    const displayVersion = normalizeAddressForDisplay(testCase.address);
    console.log('   Display format:', {
      province: displayVersion.province,
      city: displayVersion.city,
      district: displayVersion.district
    });
    
    // Test normalization for storage
    const storageVersion = normalizeAddressForStorage(testCase.address);
    console.log('   Storage format:', {
      province: storageVersion.province,
      city: storageVersion.city,
      district: storageVersion.district
    });
    
    // Test validation
    const validation = validateCustomerAddress(testCase.address);
    console.log('   Validation:', validation.isValid ? '✅ Valid' : '❌ Invalid');
    if (!validation.isValid) {
      console.log('   Errors:', Object.values(validation.errors));
    }
  });
  
  console.log('\n✨ Test Complete!');
  return {
    stats,
    testResults: testCases.map(testCase => ({
      name: testCase.name,
      validation: validateCustomerAddress(testCase.address),
      displayVersion: normalizeAddressForDisplay(testCase.address),
      storageVersion: normalizeAddressForStorage(testCase.address)
    }))
  };
}

/**
 * Test specific problematic case from user report
 */
export function testProblematicCase() {
  console.log('\n🔍 Testing Problematic Case: Province ID 12 (Sumatera Utara)');
  console.log('-'.repeat(50));
  
  const problematicAddress = {
    province: "12",    // Sumatera Utara
    city: "1275",      // Medan  
    district: "Medan Baru",
    village: "Babura", 
    street: "Test Street",
    postalCode: "20119"
  };
  
  const validation = validateCustomerAddress(problematicAddress);
  const displayVersion = normalizeAddressForDisplay(problematicAddress);
  const storageVersion = normalizeAddressForStorage(problematicAddress);
  
  console.log('Original data:', problematicAddress);
  console.log('Display version:', displayVersion);
  console.log('Storage version:', storageVersion);
  console.log('Validation result:', validation);
  
  return {
    original: problematicAddress,
    display: displayVersion,
    storage: storageVersion,
    validation
  };
}

// Export for use in browser console or testing
if (typeof window !== 'undefined') {
  (window as any).testAddressData = {
    testAddressHandling,
    testProblematicCase,
    sampleFirestoreData,
    testCases
  };
}