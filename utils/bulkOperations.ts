import { collection, writeBatch, doc, serverTimestamp, DocumentReference, WriteBatch } from 'firebase/firestore';
import { firestore } from '@/db/firebase/firebaseConfig';
import { Product } from '@/types/product';
import { ImportConfig, ImportResult, ImportError, BulkEditOperation, UpdateResult } from '@/types/bulkOperations';
import { prepareProductForImport, checkMultipleProductNumbers } from './productValidator';
import { ValidationMessages } from './validationMessages';

/**
 * Performs bulk import of products to Firebase
 * Handles batching, duplicate checking, and error tracking
 * @param products - Array of product data to import
 * @param config - Import configuration options
 * @param userId - Current user ID for audit trail
 * @returns Promise resolving to import results
 */
export async function bulkImportProducts(
  products: Record<string, any>[],
  config: ImportConfig,
  userId?: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };
  
  try {
    // Check for existing product numbers if needed
    let existingNumbers = new Set<string>();
    if (config.skipDuplicates || config.updateExisting) {
      const productNumbers = products.map(p => p.productNumber).filter(Boolean);
      existingNumbers = await checkMultipleProductNumbers(productNumbers);
    }
    
    // Firebase batch operations are limited to 500
    const BATCH_SIZE = 500;
    const batches: WriteBatch[] = [];
    
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batchProducts = products.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(firestore);
      let batchOperations = 0;
      
      for (let j = 0; j < batchProducts.length; j++) {
        const rowIndex = i + j;
        const productData = batchProducts[j];
        
        try {
          // Check if we should skip this product
          if (existingNumbers.has(productData.productNumber)) {
            if (config.skipDuplicates) {
              result.skipped++;
              continue;
            } else if (!config.updateExisting) {
              result.errors.push({
                row: rowIndex + 2,
                field: 'productNumber',
                value: productData.productNumber,
                error: 'Product number already exists'
              });
              result.failed++;
              continue;
            }
          }
          
          // Prepare product for import
          const product = prepareProductForImport(productData);
          
          // Add user reference if available
          if (userId) {
            product.createdBy = doc(firestore, 'users', userId) as DocumentReference;
          }
          
          // Add to batch
          const docRef = doc(collection(firestore, 'products'));
          batch.set(docRef, {
            ...product,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          batchOperations++;
          
        } catch (error: any) {
          result.errors.push({
            row: rowIndex + 2,
            field: 'general',
            value: JSON.stringify(productData),
            error: error.message || 'Failed to prepare product for import'
          });
          result.failed++;
        }
      }
      
      // Only commit batch if there are operations
      if (batchOperations > 0) {
        batches.push(batch);
      }
    }
    
    // Commit all batches
    for (const batch of batches) {
      try {
        await batch.commit();
        // Count successful operations (this is approximate)
        result.success += BATCH_SIZE;
      } catch (error: any) {
        console.error('Batch commit error:', error);
        result.errors.push({
          row: 0,
          field: 'batch',
          value: '',
          error: 'Failed to commit batch: ' + error.message
        });
      }
    }
    
    // Adjust success count
    result.success = Math.min(result.success, products.length - result.failed - result.skipped);
    
  } catch (error: any) {
    console.error('Bulk import error:', error);
    result.errors.push({
      row: 0,
      field: 'general',
      value: '',
      error: 'Import failed: ' + error.message
    });
  }
  
  return result;
}

/**
 * Performs bulk update of existing products
 * @param operation - Bulk edit operation details
 * @param userId - Current user ID for audit trail
 * @returns Promise resolving to update results
 */
export async function bulkUpdateProducts(
  operation: BulkEditOperation,
  userId?: string
): Promise<UpdateResult> {
  const result: UpdateResult = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  try {
    const BATCH_SIZE = 500;
    const productIds = operation.productIds;
    
    for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
      const batchIds = productIds.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(firestore);
      
      for (const productId of batchIds) {
        try {
          const docRef = doc(firestore, 'products', productId);
          
          const updateData: any = {
            ...operation.updates,
            updatedAt: serverTimestamp()
          };
          
          // Add specs updates if provided - merge with existing specs
          if (operation.updateSpecs && Object.keys(operation.updateSpecs).length > 0) {
            // Use field-level updates for specs to preserve existing values
            Object.keys(operation.updateSpecs).forEach(key => {
              updateData[`specs.${key}`] = operation.updateSpecs![key];
            });
          }
          
          // Add user reference if available
          if (userId) {
            updateData.updatedBy = doc(firestore, 'users', userId);
          }
          
          batch.update(docRef, updateData);
          
        } catch (error: any) {
          result.errors.push({
            productId,
            error: error.message || 'Failed to prepare update'
          });
          result.failed++;
        }
      }
      
      // Commit batch
      try {
        await batch.commit();
        result.success += batchIds.length - result.failed;
      } catch (error: any) {
        console.error('Batch update error:', error);
        batchIds.forEach(id => {
          result.errors.push({
            productId: id,
            error: 'Failed to commit batch: ' + error.message
          });
        });
        result.failed += batchIds.length;
      }
    }
    
  } catch (error: any) {
    console.error('Bulk update error:', error);
    operation.productIds.forEach(id => {
      result.errors.push({
        productId: id,
        error: 'Update failed: ' + error.message
      });
    });
    result.failed = operation.productIds.length;
  }
  
  return result;
}

/**
 * Generates a summary report of import results
 * @param result - Import result object
 * @returns Formatted summary string
 */
export function generateImportSummary(result: ImportResult): string {
  const productType = 'produk';
  const total = result.success + result.failed + result.skipped;
  
  const lines = [
    ValidationMessages.IMPORT_SUMMARY_HEADER,
    '',
    ValidationMessages.TOTAL_PROCESSED(total, productType),
    ValidationMessages.SUCCESSFULLY_IMPORTED(result.success, productType),
    ValidationMessages.SKIPPED_DUPLICATES(result.skipped, productType),
    ValidationMessages.FAILED_IMPORT(result.failed, productType)
  ];
  
  // Add status messages
  if (result.success > 0) {
    lines.push('', ValidationMessages.IMPORT_SUCCESS_MESSAGE(result.success, productType));
  }
  if (result.failed > 0) {
    lines.push('', ValidationMessages.IMPORT_FAILURE_MESSAGE(result.failed, productType));
  }
  if (result.skipped > 0) {
    lines.push('', ValidationMessages.IMPORT_SKIPPED_MESSAGE(result.skipped, productType));
  }
  
  if (result.errors.length > 0) {
    lines.push('', 'Detail Error:');
    const errorGroups = new Map<string, number>();
    
    result.errors.forEach(error => {
      const key = error.error;
      errorGroups.set(key, (errorGroups.get(key) || 0) + 1);
    });
    
    errorGroups.forEach((count, error) => {
      lines.push(`  - ${error} (${count} kejadian)`);
    });
  }
  
  return lines.join('\n');
}

/**
 * Creates a CSV error report for download
 * @param errors - Array of import errors
 * @returns CSV string of error report
 */
export function createErrorReport(errors: ImportError[]): string {
  if (errors.length === 0) {
    return 'No errors';
  }
  
  const headers = ['Row', 'Field', 'Value', 'Error'];
  const rows = errors.map(error => [
    error.row,
    error.field,
    error.value,
    error.error
  ]);
  
  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      const value = String(cell);
      if (value.includes(',') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ].join('\n');
}