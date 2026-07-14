import { MaintenanceTableRow } from "./maintenanceDataLoader";
import { MaintenanceFilters } from "@/components/Admin/Maintenances/MaintenanceFilters";

function rangesOverlap(
  leftStart: Date,
  leftEnd: Date,
  rightStart: Date,
  rightEnd: Date,
): boolean {
  return leftStart <= rightEnd && leftEnd >= rightStart;
}

function periodIncludesMonth(
  startDate: Date,
  endDate: Date,
  month: number,
): boolean {
  const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const cursor = new Date(startMonth);

  while (cursor <= endMonth) {
    if (cursor.getMonth() + 1 === month) return true;
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return false;
}

function maintenanceOverlapsMonthYear(
  maintenance: MaintenanceTableRow,
  month: number,
  year: number,
): boolean {
  if (!maintenance.startDate || !maintenance.endDate) return false;

  if (month > 0 && year > 0) {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
    return rangesOverlap(
      maintenance.startDate,
      maintenance.endDate,
      monthStart,
      monthEnd,
    );
  }

  if (month > 0) {
    return periodIncludesMonth(
      maintenance.startDate,
      maintenance.endDate,
      month,
    );
  }

  if (year > 0) {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);
    return rangesOverlap(
      maintenance.startDate,
      maintenance.endDate,
      yearStart,
      yearEnd,
    );
  }

  return true;
}

/**
 * Client-side filtering for maintenance data when Firestore queries are not optimal
 */
export function applyMaintenanceFilters(
  maintenances: MaintenanceTableRow[],
  filters: MaintenanceFilters
): MaintenanceTableRow[] {
  let filtered = [...maintenances];

  // Text search across multiple fields
  if (filters.search && filters.search.trim() !== "") {
    const searchTerm = filters.search.toLowerCase().trim();
    
    filtered = filtered.filter(maintenance => {
      const searchContent = [
        maintenance.contractNumber,
        maintenance.contractName,
        maintenance.productNumber,
        maintenance.productName,
        maintenance.productType,
        ...maintenance.engineers.map(e => e.name),
        maintenance.contractData?.customerData?.name || "",
        maintenance.status
      ].join(' ').toLowerCase();
      
      return searchContent.includes(searchTerm);
    });
  }

  // Status filter
  if (filters.status && filters.status.trim() !== "") {
    filtered = filtered.filter(maintenance => maintenance.status === filters.status);
  }

  // Product type filter
  if (filters.productType && filters.productType.trim() !== "") {
    filtered = filtered.filter(maintenance => maintenance.productType === filters.productType);
  }

  // Contract number filter
  if (filters.contractNumber && filters.contractNumber.trim() !== "") {
    const contractSearch = filters.contractNumber.toLowerCase().trim();
    filtered = filtered.filter(maintenance => 
      maintenance.contractNumber.toLowerCase().includes(contractSearch)
    );
  }

  // Engineer filter
  if (filters.engineerId && filters.engineerId.trim() !== "") {
    filtered = filtered.filter(maintenance =>
      maintenance.engineers.some(engineer => engineer.id === filters.engineerId)
    );
  }

  // Month/year filter checks the full maintenance period, not only startDate.
  if ((filters.month > 0 && filters.month <= 12) || filters.year > 0) {
    filtered = filtered.filter(maintenance =>
      maintenanceOverlapsMonthYear(maintenance, filters.month, filters.year)
    );
  }

  // Date range filter
  if (filters.dateRange.start || filters.dateRange.end) {
    filtered = filtered.filter(maintenance => {
      if (!maintenance.startDate && !maintenance.endDate) return false;
      
      const maintenanceStart = maintenance.startDate;
      const maintenanceEnd = maintenance.endDate;
      
      // Check start date filter
      if (filters.dateRange.start && maintenanceStart) {
        if (maintenanceStart < filters.dateRange.start) return false;
      }
      
      // Check end date filter
      if (filters.dateRange.end && maintenanceEnd) {
        if (maintenanceEnd > filters.dateRange.end) return false;
      }
      
      return true;
    });
  }

  // Inspection status filter
  if (filters.hasInspection && filters.hasInspection.trim() !== "") {
    const hasInspectionValue = filters.hasInspection === "yes";
    filtered = filtered.filter(maintenance => 
      maintenance.hasInspection === hasInspectionValue
    );
  }

  return filtered;
}

/**
 * Client-side sorting for maintenance data
 */
export function applyMaintenanceSorting(
  maintenances: MaintenanceTableRow[],
  sortBy: MaintenanceFilters['sortBy'],
  sortOrder: MaintenanceFilters['sortOrder']
): MaintenanceTableRow[] {
  const sorted = [...maintenances];

  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case "startDate":
        aValue = a.startDate?.getTime() || 0;
        bValue = b.startDate?.getTime() || 0;
        break;
      case "endDate":
        aValue = a.endDate?.getTime() || 0;
        bValue = b.endDate?.getTime() || 0;
        break;
      case "status":
        // Sort by status priority
        const statusOrder = {
          "pending": 1,
          "scheduled": 2,
          "waiting_approval": 3,
          "approved": 4,
          "rejected": 5
        };
        aValue = statusOrder[a.status] || 999;
        bValue = statusOrder[b.status] || 999;
        break;
      case "createdAt":
        // Note: We don't have createdAt in MaintenanceTableRow, fallback to startDate
        aValue = a.startDate?.getTime() || 0;
        bValue = b.startDate?.getTime() || 0;
        break;
      case "updatedAt":
        // Note: We don't have updatedAt in MaintenanceTableRow, fallback to startDate
        aValue = a.startDate?.getTime() || 0;
        bValue = b.startDate?.getTime() || 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortOrder === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === "asc" ? 1 : -1;
    }
    return 0;
  });

  return sorted;
}

/**
 * Combined filter and sort function for maintenance data
 */
export function filterAndSortMaintenances(
  maintenances: MaintenanceTableRow[],
  filters: MaintenanceFilters
): MaintenanceTableRow[] {
  // Apply filters first
  const filtered = applyMaintenanceFilters(maintenances, filters);
  
  // Then apply sorting
  const sorted = applyMaintenanceSorting(filtered, filters.sortBy, filters.sortOrder);
  
  return sorted;
}

/**
 * Extracts unique values for filter options
 */
export function extractFilterOptions(maintenances: MaintenanceTableRow[]): {
  availableStatuses: string[];
  availableProductTypes: string[];
  availableYears: number[];
  availableEngineers: Array<{ id: string; name: string }>;
} {
  const statuses = new Set<string>();
  const productTypes = new Set<string>();
  const years = new Set<number>();
  const engineersMap = new Map<string, string>();

  maintenances.forEach(maintenance => {
    statuses.add(maintenance.status);
    productTypes.add(maintenance.productType);
    
    if (maintenance.startDate) years.add(maintenance.startDate.getFullYear());
    if (maintenance.endDate) years.add(maintenance.endDate.getFullYear());
    
    maintenance.engineers.forEach(engineer => {
      engineersMap.set(engineer.id, engineer.name);
    });
  });

  return {
    availableStatuses: Array.from(statuses).sort(),
    availableProductTypes: Array.from(productTypes).sort(),
    availableYears: Array.from(years).sort((a, b) => b - a), // Most recent first
    availableEngineers: Array.from(engineersMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  };
}

/**
 * Creates default filter state
 */
export function createDefaultMaintenanceFilters(): MaintenanceFilters {
  const currentDate = new Date();
  
  return {
    search: "",
    status: "",
    productType: "",
    contractNumber: "",
    engineerId: "",
    month: currentDate.getMonth() + 1, // Default to current month
    year: 0, // 0 means all years
    dateRange: {
      start: null,
      end: null
    },
    hasInspection: "",
    sortBy: "startDate",
    sortOrder: "asc"
  };
}

/**
 * Checks if any filters are active (except search and default sort)
 */
export function hasActiveMaintenanceFilters(filters: MaintenanceFilters): boolean {
  return !!(
    filters.status ||
    filters.productType ||
    filters.contractNumber ||
    filters.engineerId ||
    filters.month > 0 ||
    filters.year > 0 ||
    filters.dateRange.start ||
    filters.dateRange.end ||
    filters.hasInspection ||
    filters.sortBy !== "startDate" ||
    filters.sortOrder !== "asc"
  );
}

/**
 * Resets filters to default state but preserves search
 */
export function resetMaintenanceFilters(
  currentFilters: MaintenanceFilters,
  preserveSearch: boolean = true
): MaintenanceFilters {
  const defaultFilters = createDefaultMaintenanceFilters();
  
  if (preserveSearch) {
    defaultFilters.search = currentFilters.search;
  }
  
  return defaultFilters;
}
