import { Customer, ContactPerson } from "./customer";

// Import/Export configuration
export interface CustomerImportConfig {
  mapping: Record<string, string>; // CSV column -> customer field
  skipDuplicates: boolean;
  updateExisting: boolean;
  validateAddresses: boolean;
}

export interface CustomerImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: CustomerImportError[];
}

export interface CustomerImportError {
  row: number;
  field: string;
  value: any;
  error: string;
}

export interface CustomerExportConfig {
  format: 'csv' | 'excel';
  fields: string[];
  filters: CustomerFilters;
  includeContacts: boolean;
  includeAddress: boolean;
}

// Filter types
export interface CustomerFilters {
  searchTerm?: string;
  customerType?: string[];
  businessField?: string[];
  province?: string[];
  city?: string[];
  hasContracts?: boolean;
  dateRange?: {
    start: string;
    end: string;
    field: 'createdAt' | 'updatedAt';
  };
}

// Parsed CSV data
export interface CustomerParsedData {
  headers: string[];
  rows: CustomerImportRow[];
}

export interface CustomerImportRow {
  // Basic info
  customerName?: string;
  customerType?: string;
  businessField?: string;
  
  // Address fields
  street?: string;
  village?: string;
  district?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  
  // Primary contact
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  primaryContactPosition?: string;
  primaryContactDepartment?: string;
  
  // Additional contacts (pipe-separated)
  additionalContacts?: string;
  
  // Raw row data
  [key: string]: any;
}

// Validation results
export interface CustomerValidationResult {
  valid: boolean;
  errors: CustomerValidationError[];
  warnings: CustomerValidationWarning[];
}

export interface CustomerValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface CustomerValidationWarning {
  row: number;
  field: string;
  value: any;
  message: string;
}

// Bulk operations
export interface CustomerBulkOperation {
  customerIds: string[];
  operation: 'delete' | 'export' | 'update';
  data?: Partial<Customer>;
}

export interface CustomerBulkResult {
  success: number;
  failed: number;
  errors: Array<{
    customerId: string;
    error: string;
  }>;
}

// Template generation
export interface CustomerTemplateConfig {
  includeExample: boolean;
  contactCount: number;
  addressLevel: 'basic' | 'complete';
}