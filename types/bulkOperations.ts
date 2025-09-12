import { Product, ProductSpecs } from "./product";

export interface ImportConfig {
  mapping: Record<string, string>; // CSV column -> product field
  skipDuplicates: boolean;
  updateExisting: boolean;
  validateBeforeImport: boolean;
}

export interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field: string;
  value: any;
  error: string;
}

export interface BulkEditOperation {
  productIds: string[];
  updates: Partial<Product>;
  updateSpecs: Partial<ProductSpecs>;
}

export interface UpdateResult {
  success: number;
  failed: number;
  errors: Array<{
    productId: string;
    error: string;
  }>;
}

export interface ExportConfig {
  format: 'csv' | 'excel';
  fields: string[];
  filters: ProductFilters;
  includeSpecs: boolean;
  includeContract: boolean;
}

export interface ProductFilters {
  searchTerm?: string;
  typeFilter?: string | null;
  brandFilter?: string | null;
}

export interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface ValidationWarning {
  row: number;
  field: string;
  value: any;
  message: string;
}