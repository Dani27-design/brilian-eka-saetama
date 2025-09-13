/**
 * Address Migration Helper
 * Utilities to help migrate and normalize existing customer address data
 */

import { CustomerAddress } from '@/types/customer';
import { normalizeAddressForDisplay, normalizeAddressForStorage, getProvinceById, getCityById } from './indonesianRegions';

export interface AddressMigrationResult {
  success: boolean;
  original: Partial<CustomerAddress>;
  normalized: Partial<CustomerAddress>;
  changes: string[];
  warnings: string[];
  errors: string[];
}

/**
 * Migrate a single address record
 */
export function migrateAddress(address: Partial<CustomerAddress>): AddressMigrationResult {
  const result: AddressMigrationResult = {
    success: false,
    original: { ...address },
    normalized: { ...address },
    changes: [],
    warnings: [],
    errors: []
  };

  if (!address.province || !address.city) {
    result.errors.push('Province and city are required for migration');
    return result;
  }

  try {
    // Check if province is an ID (numeric) and needs display name
    if (!isNaN(Number(address.province))) {
      const province = getProvinceById(address.province);
      if (province) {
        result.changes.push(`Province: ID "${address.province}" → Name "${province.name}"`);
      } else {
        result.warnings.push(`Province ID "${address.province}" not found in database`);
      }
    }

    // Check if city is an ID (numeric) and needs display name  
    if (!isNaN(Number(address.city))) {
      const city = getCityById(address.city);
      if (city) {
        result.changes.push(`City: ID "${address.city}" → Name "${city.name}"`);
      } else {
        result.warnings.push(`City ID "${address.city}" not found in database`);
      }
    }

    // Normalize for display (this will convert IDs to names where possible)
    result.normalized = normalizeAddressForDisplay({
      province: address.province,
      city: address.city,
      district: address.district || '',
      village: address.village || ''
    });

    // Add other fields that don't need normalization
    result.normalized = {
      ...result.normalized,
      street: address.street,
      postalCode: address.postalCode
    };

    result.success = result.errors.length === 0;
    
  } catch (error) {
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Batch migrate multiple addresses
 */
export function batchMigrateAddresses(addresses: Partial<CustomerAddress>[]): {
  results: AddressMigrationResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    withWarnings: number;
    totalChanges: number;
  };
} {
  const results = addresses.map(migrateAddress);
  
  const summary = {
    total: addresses.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    withWarnings: results.filter(r => r.warnings.length > 0).length,
    totalChanges: results.reduce((sum, r) => sum + r.changes.length, 0)
  };

  return { results, summary };
}

/**
 * Generate migration report
 */
export function generateMigrationReport(results: AddressMigrationResult[]): string {
  const report = ['📋 Address Migration Report', '='.repeat(50), ''];
  
  const summary = {
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    withWarnings: results.filter(r => r.warnings.length > 0).length,
    totalChanges: results.reduce((sum, r) => sum + r.changes.length, 0)
  };

  report.push(`📊 Summary:`);
  report.push(`   Total addresses: ${summary.total}`);
  report.push(`   ✅ Successful: ${summary.successful}`);
  report.push(`   ❌ Failed: ${summary.failed}`);
  report.push(`   ⚠️  With warnings: ${summary.withWarnings}`);
  report.push(`   🔄 Total changes: ${summary.totalChanges}`);
  report.push('');

  // Show detailed results for failed migrations
  const failedResults = results.filter(r => !r.success);
  if (failedResults.length > 0) {
    report.push(`❌ Failed Migrations (${failedResults.length}):`);
    failedResults.forEach((result, index) => {
      report.push(`   ${index + 1}. Province: "${result.original.province}", City: "${result.original.city}"`);
      result.errors.forEach(error => report.push(`      Error: ${error}`));
    });
    report.push('');
  }

  // Show addresses with warnings
  const resultsWithWarnings = results.filter(r => r.warnings.length > 0);
  if (resultsWithWarnings.length > 0) {
    report.push(`⚠️  Addresses with Warnings (${resultsWithWarnings.length}):`);
    resultsWithWarnings.forEach((result, index) => {
      report.push(`   ${index + 1}. Province: "${result.original.province}", City: "${result.original.city}"`);
      result.warnings.forEach(warning => report.push(`      Warning: ${warning}`));
    });
    report.push('');
  }

  return report.join('\n');
}

/**
 * Validate migrated addresses
 */
export function validateMigratedAddresses(results: AddressMigrationResult[]): {
  allValid: boolean;
  validationResults: Array<{
    index: number;
    isValid: boolean;
    errors: string[];
    address: Partial<CustomerAddress>;
  }>;
} {
  const { validateCustomerAddress } = require('./addressHelper');
  
  const validationResults = results.map((result, index) => {
    const validation = validateCustomerAddress(result.normalized);
    return {
      index,
      isValid: validation.isValid,
      errors: Object.values(validation.errors).filter((error): error is string => typeof error === 'string'),
      address: result.normalized
    };
  });

  return {
    allValid: validationResults.every(r => r.isValid),
    validationResults
  };
}

/**
 * Example usage for the problematic data from the user's report
 */
export function testUserProblematicData() {
  console.log('🧪 Testing User\'s Problematic Data');
  console.log('='.repeat(40));

  const problematicAddress = {
    city: "3171",                    // ID stored (Jakarta Selatan)
    district: "Kebayoran Baru",      // Name stored  
    postalCode: "12190",
    province: "31",                  // ID stored (DKI Jakarta)
    street: "Jl Sudirman No 123 RT 001 RW 002",
    village: "Kebayoran Baru"        // Name stored
  };

  const migrationResult = migrateAddress(problematicAddress);
  const report = generateMigrationReport([migrationResult]);
  
  console.log('Original address:', problematicAddress);
  console.log('Migration result:', migrationResult);
  console.log('\nReport:');
  console.log(report);
  
  return migrationResult;
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  (window as any).addressMigration = {
    migrateAddress,
    batchMigrateAddresses,
    generateMigrationReport,
    validateMigratedAddresses,
    testUserProblematicData
  };
}