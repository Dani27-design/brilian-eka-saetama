import { ProductType, InspectionChecklist } from "@/types/maintenances";

/**
 * Gets the checklist item names for a specific product type
 * Used to generate dynamic table columns for inspection display
 * 
 * @param productType - The product type to get checklist items for
 * @returns Array of checklist item names
 * 
 * @example
 * const aparItems = getChecklistItemsByType("APAR");
 * // Returns: ["Hose", "Pressure", "Handle", "Body", "Safety Pin", "Exp Date"]
 */
export function getChecklistItemsByType(productType: ProductType): string[] {
  switch (productType) {
    case "APAR":
      return ["Hose", "Pressure", "Handle", "Body", "Safety Pin", "Exp Date"];
    case "HYDRANT":
      return ["Height", "Width", "Flow Rate", "Pressure", "Valve Type", "Hose Length", "Material"];
    case "CCTV":
      return ["Resolution", "Lens", "Night Vision", "Power", "Connectivity", "Pan", "Tilt", "Storage Capacity"];
    case "FIRE_ALARM":
      return ["Sensor Type", "Power", "Coverage Area", "Sound Level", "Battery Backup", "Connectivity"];
    case "ACCESS_DOOR":
      return ["Material", "Lock Type", "Width", "Height", "Opening Speed"];
    case "PATROL_GUARD":
      return ["Device Type", "Battery Life", "Connectivity", "Patrol Interval", "Firmware Version"];
    default:
      return [];
  }
}

/**
 * Gets the status (OK/NOK) for a specific checklist item
 * Searches through the checklist array to find the matching item
 * 
 * @param checklistDetails - The checklist array from inspection
 * @param itemName - The name of the checklist item to find
 * @returns Status string ("OK", "NOK", or "-" if not found)
 * 
 * @example
 * const status = getChecklistItemStatus(checklist, "Hose");
 * // Returns: "OK" or "NOK" or "-"
 */
export function getChecklistItemStatus(checklistDetails: any[], itemName: string): string {
  if (!Array.isArray(checklistDetails) || checklistDetails.length === 0) {
    return "-";
  }
  
  const item = checklistDetails.find((item: any) => item.item === itemName);
  if (!item) return "-";
  return item.status ? "OK" : "NOK";
}

/**
 * Gets the remarks for a specific checklist item
 * Searches through the checklist array to find remarks for the matching item
 * 
 * @param checklistDetails - The checklist array from inspection
 * @param itemName - The name of the checklist item to find
 * @returns Remarks string or "-" if none found
 * 
 * @example
 * const remarks = getChecklistItemRemarks(checklist, "Hose");
 * // Returns: "Good condition" or "-"
 */
export function getChecklistItemRemarks(checklistDetails: any[], itemName: string): string {
  if (!Array.isArray(checklistDetails) || checklistDetails.length === 0) {
    return "-";
  }
  
  const item = checklistDetails.find((item: any) => item.item === itemName);
  return item?.remarks || "-";
}

/**
 * Gets the status color class for styling checklist item status
 * Returns appropriate CSS classes for OK/NOK status display
 * 
 * @param status - The status string ("OK", "NOK", or "-")
 * @returns CSS class string for styling
 * 
 * @example
 * const colorClass = getStatusColorClass("OK");
 * // Returns: "text-green-600 font-semibold"
 */
export function getStatusColorClass(status: string): string {
  switch (status) {
    case "OK":
      return "text-green-600 font-semibold";
    case "NOK":
      return "text-red-600 font-semibold";
    default:
      return "text-gray-400";
  }
}

/**
 * Filters inspections that match the selected checklist type
 * Used to show only relevant inspections for a specific product type
 * 
 * @param inspections - Array of all inspection rows
 * @param checklistType - The product type to filter by
 * @returns Filtered array of inspections
 * 
 * @example
 * const aparInspections = filterInspectionsByType(allInspections, "APAR");
 */
export function filterInspectionsByType(inspections: any[], checklistType: ProductType): any[] {
  return inspections.filter(inspection => inspection.productType === checklistType);
}

/**
 * Gets all available product types for checklist filtering
 * Used to populate the checklist type filter dropdown
 * 
 * @returns Array of all product types
 */
export function getAllProductTypes(): ProductType[] {
  return ["APAR", "HYDRANT", "CCTV", "FIRE_ALARM", "ACCESS_DOOR", "PATROL_GUARD"];
}

/**
 * Gets a human-readable display name for a product type
 * Used for UI display of product type names
 * 
 * @param productType - The product type
 * @returns Display name string
 */
export function getProductTypeDisplayName(productType: ProductType): string {
  const displayNames: Record<ProductType, string> = {
    "APAR": "APAR",
    "HYDRANT": "Hydrant",
    "CCTV": "CCTV",
    "FIRE_ALARM": "Fire Alarm",
    "ACCESS_DOOR": "Access Door",
    "PATROL_GUARD": "Patrol Guard"
  };
  
  return displayNames[productType] || productType;
}

/**
 * Generates table headers for dynamic checklist columns
 * Creates headers for both status and remarks of each checklist item
 * 
 * @param productType - The product type to generate headers for
 * @returns Array of header objects with key and label
 * 
 * @example
 * const headers = generateChecklistHeaders("APAR");
 * // Returns: [
 * //   { key: "hose_status", label: "Hose Status" },
 * //   { key: "hose_remarks", label: "Hose Remarks" },
 * //   ...
 * // ]
 */
export function generateChecklistHeaders(productType: ProductType): Array<{key: string, label: string}> {
  const items = getChecklistItemsByType(productType);
  const headers: Array<{key: string, label: string}> = [];
  
  items.forEach(item => {
    const key = item.toLowerCase().replace(/\s+/g, '_');
    headers.push(
      { key: `${key}_status`, label: `${item} Status` },
      { key: `${key}_remarks`, label: `${item} Remarks` }
    );
  });
  
  return headers;
}

/**
 * Calculates summary statistics for checklist items across inspections
 * Provides overview of pass/fail rates for each checklist item
 * 
 * @param inspections - Array of inspection data
 * @param productType - The product type to analyze
 * @returns Summary statistics object
 */
export function getChecklistSummaryStats(inspections: any[], productType: ProductType): {
  totalInspections: number;
  itemStats: Record<string, { okCount: number; nokCount: number; passRate: number }>;
} {
  const relevantInspections = filterInspectionsByType(inspections, productType);
  const items = getChecklistItemsByType(productType);
  const itemStats: Record<string, { okCount: number; nokCount: number; passRate: number }> = {};
  
  // Initialize stats for each item
  items.forEach(item => {
    itemStats[item] = { okCount: 0, nokCount: 0, passRate: 0 };
  });
  
  // Count OK/NOK for each item across all inspections
  relevantInspections.forEach(inspection => {
    if (inspection.checklistDetails && Array.isArray(inspection.checklistDetails)) {
      items.forEach(item => {
        const status = getChecklistItemStatus(inspection.checklistDetails, item);
        if (status === "OK") {
          itemStats[item].okCount++;
        } else if (status === "NOK") {
          itemStats[item].nokCount++;
        }
      });
    }
  });
  
  // Calculate pass rates
  items.forEach(item => {
    const total = itemStats[item].okCount + itemStats[item].nokCount;
    itemStats[item].passRate = total > 0 ? Math.round((itemStats[item].okCount / total) * 100) : 0;
  });
  
  return {
    totalInspections: relevantInspections.length,
    itemStats
  };
}