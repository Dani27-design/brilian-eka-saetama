import { 
  query, 
  orderBy, 
  where, 
  QueryConstraint,
  CollectionReference,
  DocumentData,
  Query,
  Timestamp
} from "firebase/firestore";
import { MaintenanceFilters } from "@/components/Admin/Maintenances/MaintenanceFilters";
import { MaintenanceStatus } from "@/types/maintenances";

/**
 * Sortable fields that can be used with Firestore orderBy for maintenances
 */
export type SortableMaintenanceField = "startDate" | "endDate" | "status" | "createdAt" | "updatedAt";

/**
 * Configuration for building maintenance queries
 */
export interface MaintenanceQueryConfig {
  filters: MaintenanceFilters;
  useFirestoreSort: boolean;
}

/**
 * Result of query building with metadata
 */
export interface MaintenanceQueryBuildResult {
  query: Query<DocumentData> | null;
  useClientSort: boolean;
  sortField: SortableMaintenanceField;
  sortOrder: "asc" | "desc";
  errorMessage?: string;
}

/**
 * Maps filter sort options to Firestore field names
 */
const MAINTENANCE_SORT_FIELD_MAPPING: Record<MaintenanceFilters['sortBy'], SortableMaintenanceField> = {
  startDate: "startDate",
  endDate: "endDate",
  status: "status",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};

/**
 * Fields that support direct Firestore sorting without conflicts
 */
const FIRESTORE_SAFE_MAINTENANCE_SORT_FIELDS: SortableMaintenanceField[] = [
  "startDate",
  "endDate", 
  "status",
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
 * - Complex filters on related data require client-side processing
 */
export function canUseMaintenanceFirestoreSort(filters: MaintenanceFilters): boolean {
  // If there's a search term, we need client-side filtering for text search
  if (filters.search && filters.search.trim() !== "") {
    return false;
  }

  // If filtering by contract number or engineer name, use client-side
  // because these require checking related documents
  if (filters.contractNumber && filters.contractNumber.trim() !== "") {
    return false;
  }

  if (filters.engineerId && filters.engineerId.trim() !== "") {
    return false;
  }

  // If using custom date range with both start and end, use client-side
  // to avoid complex Firestore range queries
  if (filters.dateRange.start && filters.dateRange.end) {
    return false;
  }

  // If filtering by inspection status, use client-side
  // because it requires checking existence of inspection field
  if (filters.hasInspection && filters.hasInspection.trim() !== "") {
    return false;
  }

  // Check if the sort field is supported by Firestore
  const sortField = MAINTENANCE_SORT_FIELD_MAPPING[filters.sortBy];
  return FIRESTORE_SAFE_MAINTENANCE_SORT_FIELDS.includes(sortField);
}

/**
 * Builds a Firestore query with proper constraints and sorting for maintenances
 */
export function buildMaintenanceQuery(
  maintenancesCollection: CollectionReference<DocumentData>,
  filters: MaintenanceFilters
): MaintenanceQueryBuildResult {
  const sortField = MAINTENANCE_SORT_FIELD_MAPPING[filters.sortBy];
  const sortOrder = filters.sortOrder;
  
  // Check if we can use Firestore sorting
  if (!canUseMaintenanceFirestoreSort(filters)) {
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
    if (filters.status && filters.status.trim() !== "") {
      queryConstraints.push(where("status", "==", filters.status));
    }

    if (filters.productType && filters.productType.trim() !== "") {
      queryConstraints.push(where("productType", "==", filters.productType));
    }

    // Month/Year filtering on startDate
    if (filters.month && filters.month > 0 && filters.year && filters.year > 0) {
      const startOfMonth = new Date(filters.year, filters.month - 1, 1);
      const endOfMonth = new Date(filters.year, filters.month, 0, 23, 59, 59);
      
      queryConstraints.push(
        where("startDate", ">=", Timestamp.fromDate(startOfMonth)),
        where("startDate", "<=", Timestamp.fromDate(endOfMonth))
      );
    } else if (filters.year && filters.year > 0) {
      // Year only filtering
      const startOfYear = new Date(filters.year, 0, 1);
      const endOfYear = new Date(filters.year, 11, 31, 23, 59, 59);
      
      queryConstraints.push(
        where("startDate", ">=", Timestamp.fromDate(startOfYear)),
        where("startDate", "<=", Timestamp.fromDate(endOfYear))
      );
    }

    // Single date range filter (start OR end, not both)
    if (filters.dateRange.start && !filters.dateRange.end) {
      queryConstraints.push(
        where("startDate", ">=", Timestamp.fromDate(filters.dateRange.start))
      );
    } else if (filters.dateRange.end && !filters.dateRange.start) {
      queryConstraints.push(
        where("endDate", "<=", Timestamp.fromDate(filters.dateRange.end))
      );
    }

    // Add sorting - must be compatible with where clauses
    queryConstraints.push(orderBy(sortField, sortOrder));

    // Build the query
    const firestoreQuery = query(maintenancesCollection, ...queryConstraints);

    return {
      query: firestoreQuery,
      useClientSort: false,
      sortField,
      sortOrder
    };

  } catch (error) {
    console.warn("Failed to build Firestore maintenance query, falling back to client-side:", error);
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
export function validateMaintenanceSortConfiguration(
  sortBy: MaintenanceFilters['sortBy'],
  filters: MaintenanceFilters
): { isValid: boolean; reason?: string } {
  const sortField = MAINTENANCE_SORT_FIELD_MAPPING[sortBy];
  
  if (!FIRESTORE_SAFE_MAINTENANCE_SORT_FIELDS.includes(sortField)) {
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

  if (filters.contractNumber && filters.contractNumber.trim() !== "") {
    return {
      isValid: false,
      reason: "Contract number filter requires client-side sorting"
    };
  }

  if (filters.engineerId && filters.engineerId.trim() !== "") {
    return {
      isValid: false,
      reason: "Engineer filter requires client-side sorting"
    };
  }

  if (filters.hasInspection && filters.hasInspection.trim() !== "") {
    return {
      isValid: false,
      reason: "Inspection status filter requires client-side sorting"
    };
  }

  // Check for complex date range filters
  if (filters.dateRange.start && filters.dateRange.end) {
    return {
      isValid: false,
      reason: "Date range filters require client-side sorting"
    };
  }

  return { isValid: true };
}

/**
 * Helper to determine the best sorting strategy based on current state
 */
export function getMaintenanceSortingStrategy(filters: MaintenanceFilters): {
  strategy: 'firestore' | 'client';
  reason: string;
} {
  const validation = validateMaintenanceSortConfiguration(filters.sortBy, filters);
  
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

/**
 * Creates optimized pagination parameters for maintenance queries
 */
export function buildMaintenancePaginationParams(
  page: number,
  itemsPerPage: number,
  totalItems: number
): {
  offset: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
} {
  const offset = (page - 1) * itemsPerPage;
  const limit = itemsPerPage;
  const hasNextPage = offset + itemsPerPage < totalItems;
  const hasPrevPage = page > 1;

  return {
    offset,
    limit,
    hasNextPage,
    hasPrevPage
  };
}