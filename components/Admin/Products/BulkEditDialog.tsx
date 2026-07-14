"use client";

import { useState, useEffect } from "react";
import { Product, ProductType } from "@/types/product";
import { BulkEditOperation } from "@/types/bulkOperations";
import { bulkUpdateProducts } from "@/utils/bulkOperations";
import { useAdmin } from "@/app/context/AdminContext";
import { 
  analyzeFieldCompatibility, 
  organizeFieldsByCategory, 
  convertFieldValue,
  getCategoryDisplayName,
  FieldDefinition 
} from "@/utils/bulkEditUtils";

interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: (Product & { contractData?: any })[];
  onSuccess: () => void;
}

/**
 * Enhanced dialog component for comprehensive bulk editing of multiple products
 * Dynamically shows all compatible fields based on selected product types
 * Supports product info, base specs, and product-specific specifications
 * Includes smart field validation and categorized organization
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
  
  // Selected field-value pairs for editing
  const [selectedFields, setSelectedFields] = useState<Array<{
    id: string;
    field: FieldDefinition;
    value: any;
  }>>([]);
  
  // Analyze field compatibility based on selected products
  const compatibility = analyzeFieldCompatibility(selectedProducts);
  
  // Get available fields for dropdown (excluding already selected ones)
  const availableFields = compatibility.availableFields.filter(
    field => !selectedFields.some(sf => sf.field.key === field.key)
  );
  
  // Current dropdown selection
  const [selectedDropdownField, setSelectedDropdownField] = useState<string>('');

  const isMaintenanceIntervalSelected = selectedFields.some(
    ({ field }) => field.key === 'maintenanceInterval'
  );
  const maintenanceContractProductCount = selectedProducts.filter(
    (product) => product.contractData?.contractType === "maintenance"
  ).length;

  /**
   * Adds a field from dropdown selection
   */
  const addField = () => {
    if (!selectedDropdownField) return;
    
    const fieldDef = compatibility.availableFields.find(f => f.key === selectedDropdownField);
    if (!fieldDef) return;
    
    const newFieldEntry = {
      id: `${fieldDef.key}-${Date.now()}`,
      field: fieldDef,
      value: fieldDef.type === 'boolean' ? false : fieldDef.type === 'number' ? 0 : ''
    };
    
    setSelectedFields(prev => [...prev, newFieldEntry]);
    setSelectedDropdownField('');
  };
  
  /**
   * Removes a field from the selected list
   */
  const removeField = (id: string) => {
    setSelectedFields(prev => prev.filter(sf => sf.id !== id));
  };

  /**
   * Handles input changes for field values
   */
  const handleFieldValueChange = (id: string, value: any) => {
    setSelectedFields(prev => prev.map(sf => 
      sf.id === id ? { ...sf, value } : sf
    ));
  };

  /**
   * Performs the bulk update operation
   */
  const handleBulkUpdate = async () => {
    if (selectedFields.length === 0) {
      setError('Please add at least one field to update');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Build update object from selected fields
      const updateData: any = {};
      const updateSpecs: any = {};
      
      selectedFields.forEach(({ field, value }) => {
        const convertedValue = convertFieldValue(field, value);
        
        if (field.category === 'product') {
          updateData[field.key] = convertedValue;
        } else {
          // Both baseSpecs and specificSpecs go to updateSpecs
          updateSpecs[field.key] = convertedValue;
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
    setSelectedFields([]);
    setSelectedDropdownField('');
    setError(null);
    setSuccessMessage(null);
    onClose();
  };

  /**
   * Renders input for a specific field entry
   */
  const renderFieldValueInput = (selectedField: { id: string; field: FieldDefinition; value: any }) => {
    const { id, field, value } = selectedField;
    
    switch (field.type) {
      case 'boolean':
        return (
          <select
            value={value === null || value === undefined ? '' : String(value)}
            onChange={(e) => {
              const val = e.target.value === '' ? null : e.target.value === 'true';
              handleFieldValueChange(id, val);
            }}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">Select...</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value instanceof Date ? value.toISOString().split('T')[0] : value || ''}
            onChange={(e) => handleFieldValueChange(id, e.target.value ? new Date(e.target.value) : null)}
            className="w-full rounded-lg border px-3 py-2"
          />
        );
      
      case 'number':
        return (
          <div className="relative">
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldValueChange(id, e.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded-lg border px-3 py-2"
            />
            {field.unit && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                {field.unit}
              </span>
            )}
          </div>
        );
      
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleFieldValueChange(id, e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">Select {field.label}...</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      default: // text
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldValueChange(id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full rounded-lg border px-3 py-2"
          />
        );
    }
  };

  /**
   * Organizes available fields by category for dropdown optgroups
   */
  const getFieldsByCategory = () => {
    return organizeFieldsByCategory(availableFields);
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
            Product types: {compatibility.productTypes.join(', ')}
          </p>
          <p className="mt-1 text-xs text-blue-600">
            {compatibility.availableFields.length} compatible fields available for editing
          </p>
          {compatibility.incompatibleFields.length > 0 && (
            <p className="mt-1 text-xs text-blue-600">
              {compatibility.incompatibleFields.length} fields hidden due to product type differences
            </p>
          )}
        </div>

        {/* Field Selection Area */}
        <div className="space-y-4">
          <h3 className="font-semibold">Edit Fields</h3>
          
          {/* Add Field Dropdown */}
          <div className="flex gap-3">
            <div className="flex-1">
              <select
                value={selectedDropdownField}
                onChange={(e) => setSelectedDropdownField(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="">Select a field to edit...</option>
                {(() => {
                  const categorizedFields = getFieldsByCategory();
                  return (
                    <>
                      {categorizedFields.product.length > 0 && (
                        <optgroup label={getCategoryDisplayName('product')}>
                          {categorizedFields.product.map(field => (
                            <option key={field.key} value={field.key}>
                              {field.label} ({field.type})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {categorizedFields.baseSpecs.length > 0 && (
                        <optgroup label={getCategoryDisplayName('baseSpecs')}>
                          {categorizedFields.baseSpecs.map(field => (
                            <option key={field.key} value={field.key}>
                              {field.label} ({field.type})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {categorizedFields.specificSpecs.length > 0 && (
                        <optgroup label={getCategoryDisplayName('specificSpecs')}>
                          {categorizedFields.specificSpecs.map(field => (
                            <option key={field.key} value={field.key}>
                              {field.label} ({field.type})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  );
                })()}
              </select>
            </div>
            <button
              type="button"
              onClick={addField}
              disabled={!selectedDropdownField}
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              Add Field
            </button>
          </div>
          
          {/* Selected Fields List */}
          {selectedFields.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Fields to Update:</h4>
              {selectedFields.map((selectedField) => (
                <div key={selectedField.id} className="flex items-start gap-3 rounded-lg border bg-gray-50 p-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {selectedField.field.label}
                        {selectedField.field.unit && (
                          <span className="text-gray-500"> ({selectedField.field.unit})</span>
                        )}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        {selectedField.field.type}
                      </span>
                    </div>
                    {renderFieldValueInput(selectedField)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeField(selectedField.id)}
                    className="text-red-500 hover:text-red-700 mt-1"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Empty State */}
          {selectedFields.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No fields selected for editing.</p>
              <p className="text-sm">Use the dropdown above to add fields to edit.</p>
            </div>
          )}
        </div>

        {/* Preview Section */}
        {selectedFields.length > 0 && (
          <div className="mt-6 rounded-lg border bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">Update Preview</h3>
            <p className="text-sm text-gray-600">
              The following changes will be applied to all {selectedProducts.length} selected products:
            </p>
            {isMaintenanceIntervalSelected && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-amber-900">
                      Jadwal maintenance existing tidak otomatis berubah dari bulk edit.
                    </p>
                    <p className="mt-1 text-amber-800">
                      Bulk edit ini hanya mengubah nilai interval pada data produk.
                      Gunakan flow edit produk untuk preview dan reschedule maintenance.
                      {maintenanceContractProductCount > 0
                        ? ` ${maintenanceContractProductCount} produk terpilih berada pada kontrak maintenance.`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <ul className="mt-2 space-y-1 text-sm">
              {selectedFields.map(({ field, value }) => {
                let displayValue = '(empty)';
                
                if (value !== null && value !== undefined && value !== '') {
                  if (field.type === 'boolean') {
                    displayValue = value ? 'Yes' : 'No';
                  } else if (field.type === 'date' && value instanceof Date) {
                    displayValue = value.toLocaleDateString();
                  } else {
                    displayValue = String(value) + (field.unit ? ` ${field.unit}` : '');
                  }
                }
                
                return (
                  <li key={field.key} className="flex items-center space-x-2">
                    <span className="font-medium">{field.label}:</span>
                    <span className="text-gray-700">{displayValue}</span>
                  </li>
                );
              })}
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
            disabled={isProcessing || selectedFields.length === 0}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
          >
            {isProcessing ? 'Updating...' : `Update ${selectedProducts.length} Products`}
          </button>
        </div>
      </div>
    </div>
  );
}
