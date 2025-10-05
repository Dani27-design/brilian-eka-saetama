import { 
  query, 
  orderBy, 
  where, 
  QueryConstraint,
  CollectionReference,
  DocumentData,
  Query
} from "firebase/firestore";
import { ProductFilters } from "@/components/Admin/Products/ProductFilters";

/**
 * Sortable fields that can be used with Firestore orderBy
 */
export type SortableField = "productNumber" | "name" | "productType" | "createdAt" | "updatedAt";

/**
 * Configuration for building product queries
 */
export interface ProductQueryConfig {
  filters: ProductFilters;
  useFirestoreSort: boolean;
}

/**
 * Result of query building with metadata
 */
export interface QueryBuildResult {
  query: Query<DocumentData> | null;
  useClientSort: boolean;
  sortField: SortableField;
  sortOrder: "asc" | "desc";
  errorMessage?: string;
}

/**
 * Maps filter sort options to Firestore field names
 */
const SORT_FIELD_MAPPING: Record<ProductFilters['sortBy'], SortableField> = {
  productNumber: "productNumber",
  name: "name", 
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};

/**
 * Fields that support direct Firestore sorting without conflicts
 */
const FIRESTORE_SAFE_SORT_FIELDS: SortableField[] = [
  "productNumber",
  "name", 
  "createdAt",
  "updatedAt"
];

/**
 * Determines if the current filters allow for safe Firestore sorting
 * 
 * Firestore constraints:
 * - Can only have one orderBy clause
 * - If using inequality filters (where clauses), orderBy must be on the same field
 * - Text search requires client-side filtering
 */
export function canUseFirestoreSort(filters: ProductFilters): boolean {
  // If there's a search term, we need client-side filtering for text search
  if (filters.search && filters.search.trim() !== "") {
    return false;
  }

  // For now, if we have contract status filter, use client-side
  // because it requires checking existence of contractData which is computed
  if (filters.contractStatus && filters.contractStatus.trim() !== "") {
    return false;
  }

  // Check if the sort field is supported by Firestore
  const sortField = SORT_FIELD_MAPPING[filters.sortBy];
  return FIRESTORE_SAFE_SORT_FIELDS.includes(sortField);
}

/**
 * Builds a Firestore query with proper constraints and sorting
 */
export function buildProductQuery(
  productsCollection: CollectionReference<DocumentData>,
  filters: ProductFilters
): QueryBuildResult {
  const sortField = SORT_FIELD_MAPPING[filters.sortBy];
  const sortOrder = filters.sortOrder;
  
  // Check if we can use Firestore sorting
  if (!canUseFirestoreSort(filters)) {
    return {
      query: null,
      useClientSort: true,
      sortField,
      sortOrder,
      errorMessage: "Using client-side sorting due to filter constraints"
    };
  }

  try {
    const queryConstraints: QueryConstraint[] = [];

    // Add equality filters (these are safe to combine with orderBy)
    if (filters.productType && filters.productType.trim() !== "") {
      queryConstraints.push(where("productType", "==", filters.productType));
    }

    // Note: brand and source are nested in specs, so we need to handle them differently
    // For now, we'll only use direct field filters with Firestore
    
    // Add sorting
    queryConstraints.push(orderBy(sortField, sortOrder));

    // Build the query
    const firestoreQuery = query(productsCollection, ...queryConstraints);

    return {
      query: firestoreQuery,
      useClientSort: false,
      sortField,
      sortOrder
    };

  } catch (error) {
    console.warn("Failed to build Firestore query, falling back to client-side:", error);
    return {
      query: null,
      useClientSort: true,
      sortField,
      sortOrder,
      errorMessage: error instanceof Error ? error.message : "Query build failed"
    };
  }
}

/**
 * Validates if a sort configuration is safe to use with current filters
 */
export function validateSortConfiguration(
  sortBy: ProductFilters['sortBy'],
  filters: ProductFilters
): { isValid: boolean; reason?: string } {
  const sortField = SORT_FIELD_MAPPING[sortBy];
  
  if (!FIRESTORE_SAFE_SORT_FIELDS.includes(sortField)) {
    return {
      isValid: false,
      reason: `Field ${sortField} is not supported for Firestore sorting`
    };
  }

  if (filters.search && filters.search.trim() !== "") {
    return {
      isValid: false, 
      reason: "Text search requires client-side sorting"
    };
  }

  if (filters.contractStatus && filters.contractStatus.trim() !== "") {
    return {
      isValid: false,
      reason: "Contract status filter requires client-side sorting"
    };
  }

  // Check for nested field filters that can't be used with Firestore easily
  if ((filters.brand && filters.brand.trim() !== "") || (filters.source && filters.source.trim() !== "")) {
    return {
      isValid: false,
      reason: "Brand and source filters require client-side sorting"
    };
  }

  return { isValid: true };
}

/**
 * Helper to determine the best sorting strategy based on current state
 */
export function getSortingStrategy(filters: ProductFilters): {
  strategy: 'firestore' | 'client';
  reason: string;
} {
  const validation = validateSortConfiguration(filters.sortBy, filters);
  
  if (!validation.isValid) {
    return {
      strategy: 'client',
      reason: validation.reason || 'Unknown validation error'
    };
  }

  return {
    strategy: 'firestore',
    reason: 'All conditions met for Firestore sorting'
  };
}