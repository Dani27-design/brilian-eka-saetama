"use client";

import { useState, useEffect } from "react";
import { Product, ProductType } from "@/types/product";
import { BulkEditOperation } from "@/types/bulkOperations";
import { bulkUpdateProducts } from "@/utils/bulkOperations";
import { useAdmin } from "@/app/context/AdminContext";

interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: (Product & { contractData?: any })[];
  onSuccess: () => void;
}

/**
 * Dialog component for bulk editing multiple products
 * Dynamically shows fields based on selected product types
 * Allows partial updates to common fields
 */
export default function BulkEditDialog({
  isOpen,
  onClose,
  selectedProducts,
  onSuccess
}: BulkEditDialogProps) {
  const { user } = useAdmin();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form state for bulk edits
  const [updates, setUpdates] = useState<{
    source?: string;
    maintenanceInterval?: number;
    brand?: string;
    brandType?: string;
  }>({});
  
  // Track which fields user wants to update
  const [fieldsToUpdate, setFieldsToUpdate] = useState<Set<string>>(new Set());
  
  // Determine common product types
  const productTypes = Array.from(new Set(selectedProducts.map(p => p.productType)));
  const isSingleType = productTypes.length === 1;
  const commonType = isSingleType ? productTypes[0] : null;

  /**
   * Toggles whether a field should be included in the bulk update
   * @param field - Field name to toggle
   */
  const toggleFieldUpdate = (field: string) => {
    const newFields = new Set(fieldsToUpdate);
    if (newFields.has(field)) {
      newFields.delete(field);
    } else {
      newFields.add(field);
    }
    setFieldsToUpdate(newFields);
  };

  /**
   * Handles input changes for update fields
   * @param field - Field name
   * @param value - New value
   */
  const handleFieldChange = (field: string, value: any) => {
    setUpdates(prev => ({
      ...prev,
      [field]: value
    }));
    // Automatically add field to update list when user types
    if (!fieldsToUpdate.has(field) && value !== '') {
      setFieldsToUpdate(new Set(Array.from(fieldsToUpdate).concat(field)));
    }
  };

  /**
   * Performs the bulk update operation
   */
  const handleBulkUpdate = async () => {
    if (fieldsToUpdate.size === 0) {
      setError('Please select at least one field to update');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Build update object with only selected fields
      const updateData: any = {};
      const updateSpecs: any = {};
      
      fieldsToUpdate.forEach(field => {
        if (field === 'brand' || field === 'brandType') {
          updateSpecs[field] = updates[field];
        } else {
          updateData[field] = updates[field];
        }
      });

      const operation: BulkEditOperation = {
        productIds: selectedProducts.map(p => p.id!).filter(Boolean),
        updates: updateData,
        updateSpecs: updateSpecs
      };

      const result = await bulkUpdateProducts(operation, user?.uid);
      
      if (result.success > 0) {
        setSuccessMessage(`Successfully updated ${result.success} products`);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      }
      
      if (result.failed > 0) {
        setError(`Failed to update ${result.failed} products`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update products');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Resets dialog state and closes
   */
  const handleClose = () => {
    setUpdates({});
    setFieldsToUpdate(new Set());
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Bulk Edit Products</h2>
            <p className="text-sm text-gray-600">
              Editing {selectedProducts.length} selected products
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-100 p-3 text-green-700">
            {successMessage}
          </div>
        )}

        {/* Product Types Info */}
        <div className="mb-4 rounded-lg bg-blue-50 p-3">
          <p className="text-sm text-blue-800">
            Product types: {productTypes.join(', ')}
          </p>
          {!isSingleType && (
            <p className="mt-1 text-xs text-blue-600">
              Only common fields across all product types are shown
            </p>
          )}
        </div>

        {/* Common Fields */}
        <div className="space-y-4">
          <h3 className="font-semibold">Common Fields</h3>
          
          {/* Source Field */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={fieldsToUpdate.has('source')}
              onChange={() => toggleFieldUpdate('source')}
              className="mt-1"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium">Source/Vendor</label>
              <input
                type="text"
                value={updates.source || ''}
                onChange={(e) => handleFieldChange('source', e.target.value)}
                disabled={!fieldsToUpdate.has('source')}
                placeholder="e.g., VENDOR ABC, INTERNAL"
                className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Maintenance Interval Field */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={fieldsToUpdate.has('maintenanceInterval')}
              onChange={() => toggleFieldUpdate('maintenanceInterval')}
              className="mt-1"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium">
                Maintenance Interval (days)
              </label>
              <input
                type="number"
                value={updates.maintenanceInterval || ''}
                onChange={(e) => handleFieldChange('maintenanceInterval', Number(e.target.value))}
                disabled={!fieldsToUpdate.has('maintenanceInterval')}
                placeholder="e.g., 30"
                className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Brand Field */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={fieldsToUpdate.has('brand')}
              onChange={() => toggleFieldUpdate('brand')}
              className="mt-1"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium">Brand</label>
              <input
                type="text"
                value={updates.brand || ''}
                onChange={(e) => handleFieldChange('brand', e.target.value)}
                disabled={!fieldsToUpdate.has('brand')}
                placeholder="e.g., ABC Fire"
                className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Brand Type Field */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={fieldsToUpdate.has('brandType')}
              onChange={() => toggleFieldUpdate('brandType')}
              className="mt-1"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium">Brand Type/Model</label>
              <input
                type="text"
                value={updates.brandType || ''}
                onChange={(e) => handleFieldChange('brandType', e.target.value)}
                disabled={!fieldsToUpdate.has('brandType')}
                placeholder="e.g., Model XYZ"
                className="mt-1 w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {fieldsToUpdate.size > 0 && (
          <div className="mt-6 rounded-lg border bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">Update Preview</h3>
            <p className="text-sm text-gray-600">
              The following changes will be applied to all {selectedProducts.length} selected products:
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {Array.from(fieldsToUpdate).map(field => (
                <li key={field} className="flex items-center space-x-2">
                  <span className="font-medium">{field}:</span>
                  <span className="text-gray-700">
                    {updates[field] || '(empty)'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleBulkUpdate}
            disabled={isProcessing || fieldsToUpdate.size === 0}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
          >
            {isProcessing ? 'Updating...' : `Update ${selectedProducts.length} Products`}
          </button>
        </div>
      </div>
    </div>
  );
}