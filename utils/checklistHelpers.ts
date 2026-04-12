import { InspectionChecklist } from "@/types/maintenances";
import { ProductType } from "@/types/product";

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
// Hydrant HPE checklist items (15 items)
export const HYDRANT_HPE_ITEMS = [
  { item: "Pemeriksaan Kotak Hydrant", detail: "Melakukan pemeriksaan dan pemeliharaan kotak hydrant beserta kelengkapannya, meliputi selang (hose) dan nozzle, untuk memastikan kondisi layak pakai." },
  { item: "Running Test Pompa Diesel", detail: "Melakukan pemeliharaan pompa hydrant diesel, termasuk pengujian operasional (running test) untuk memastikan kinerja mesin berfungsi optimal." },
  { item: "Pemeliharaan Pompa Elektrik", detail: "Melakukan pemeriksaan dan pemeliharaan pompa hydrant elektrik guna memastikan sistem bekerja secara otomatis dan normal." },
  { item: "Pemeliharaan Pompa Jockey", detail: "Melakukan pemeliharaan pompa jockey hydrant elektrik untuk menjaga kestabilan tekanan dalam sistem perpipaan." },
  { item: "Pemeriksaan Siamese Connection", detail: "Melakukan pemeriksaan dan pemeliharaan sambungan siamese (siamese connection) untuk memastikan tidak terdapat kebocoran atau kerusakan." },
  { item: "Perawatan Hydrant Pilar", detail: "Melakukan perawatan hydrant pilar ukuran 2,5 inci, termasuk pelumasan (greasing) dan pengecekan seal guna mencegah kebocoran." },
  { item: "Pemeriksaan Pressure Tank", detail: "Melakukan pemeriksaan dan pemeliharaan tangki tekanan (pressure tank) kapasitas 250 liter agar tetap berfungsi dengan baik." },
  { item: "Pemeriksaan Panel Kontrol", detail: "Melakukan pemeriksaan panel distribusi dan kontrol (controller) pompa hydrant untuk memastikan sistem kelistrikan bekerja dengan aman dan normal." },
  { item: "Penggantian Oli & Filter", detail: "Melakukan penggantian oli mesin hydrant, termasuk penggantian filter dan pengecekan bahan bakar (solar)." },
  { item: "Pengisian BBM Solar", detail: "Melakukan pengisian bahan bakar solar non-subsidi untuk mendukung operasional pompa hydrant." },
  { item: "Pengecekan Aki", detail: "Melakukan pengecekan dan pengisian air aki (accu) guna menjaga performa sistem kelistrikan." },
  { item: "Pemeliharaan Pompa Priming", detail: "Melakukan pemeliharaan pompa air pendukung (priming/pancingan) agar sistem dapat bekerja saat start awal." },
  { item: "Pembersihan Ruang Pompa", detail: "Melakukan pembersihan ruang pompa hydrant dari kotoran dan potensi penghambat operasional." },
  { item: "Pemeriksaan Instalasi Pipa", detail: "Melakukan pemeriksaan dan pemeliharaan instalasi perpipaan hydrant untuk memastikan tidak terdapat kebocoran atau kerusakan." },
  { item: "Uji Fungsi Mandatory Test", detail: "Melaksanakan uji fungsi hydrant (mandatory test) untuk memastikan seluruh sistem siap digunakan dalam kondisi darurat." },
];

// Hydrant HPO checklist items (13 items)
export const HYDRANT_HPO_ITEMS = [
  { item: "Pemeliharaan Pompa Portable", detail: "Melakukan pemeliharaan pompa air portable untuk pengisian tandon, guna memastikan suplai air tersedia dengan baik." },
  { item: "Pengecekan Tandon Air", detail: "Melakukan pengecekan kondisi tandon air, termasuk volume dan kebersihan air yang digunakan." },
  { item: "Pemeliharaan Battery Charger", detail: "Melakukan pemeliharaan battery charger serta pengisian aki (accu) untuk memastikan sistem starter berfungsi optimal." },
  { item: "Penggantian Oli Mesin", detail: "Melakukan pemeriksaan dan penggantian oli mesin sesuai kebutuhan untuk menjaga performa mesin." },
  { item: "Pengisian BBM", detail: "Melakukan pengisian bahan bakar (BBM) guna memastikan peralatan siap digunakan sewaktu-waktu." },
  { item: "Pemeriksaan Pipa Hisap & Foot Valve", detail: "Melakukan pemeriksaan dan pemeliharaan pipa hisap (intake) serta foot valve untuk memastikan tidak terjadi kebocoran atau hambatan aliran." },
  { item: "Pemeriksaan Selang & Nozzle", detail: "Melakukan pemeriksaan dan pemeliharaan selang ukuran 2 inci beserta nozzle agar dalam kondisi siap pakai." },
  { item: "Pembersihan Kotak Hydrant", detail: "Melakukan pembersihan dan perawatan kotak hydrant portable agar peralatan tersimpan dengan baik dan aman." },
  { item: "Pemeliharaan Starter Elektrik", detail: "Melakukan pemeliharaan sistem starter elektrik untuk memastikan mesin dapat dioperasikan dengan mudah." },
  { item: "Pemeriksaan Hydrant Valve", detail: "Melakukan pemeriksaan dan pemeliharaan hydrant valve ukuran 2 inci guna memastikan fungsi buka-tutup berjalan normal." },
  { item: "Pemeriksaan Panel Kontrol", detail: "Melakukan pemeriksaan dan pemeliharaan panel kontrol untuk memastikan sistem kelistrikan berfungsi dengan baik." },
  { item: "Pemeliharaan Pompa Jockey", detail: "Melakukan pemeliharaan pompa jockey (jika tersedia) untuk menjaga kestabilan tekanan sistem." },
  { item: "Uji Fungsi Mandatory Test", detail: "Melaksanakan uji fungsi peralatan hydrant portable (mandatory test) untuk memastikan kesiapan operasional." },
];

// Fire Alarm checklist items (5 items)
export const FIRE_ALARM_ITEMS = [
  { item: "Pembersihan Smoke Detector", detail: "Melakukan pembersihan smoke detector dari debu dan kotoran untuk menjaga sensitivitas deteksi asap." },
  { item: "Pengecekan Heat Detector", detail: "Melakukan pengecekan fungsi heat detector guna memastikan alat dapat merespons kenaikan suhu secara akurat." },
  { item: "Pemeriksaan Instalasi Kabel", detail: "Melakukan pemeriksaan instalasi sistem fire alarm, termasuk kabel dan koneksi, untuk memastikan tidak terdapat gangguan." },
  { item: "Pengujian Panel MCFA", detail: "Melakukan pengujian fungsi panel MCFA (Main Control Fire Alarm) guna memastikan sistem kontrol bekerja dengan baik." },
  { item: "Pengecekan Manual Call Point", detail: "Melakukan pengecekan manual call point (break glass) untuk memastikan dapat digunakan dalam kondisi darurat." },
];

/**
 * Gets the checklist item names for a specific product type
 * For HYDRANT, pass subType ("HPE" or "HPO") from product.specs.brandType
 */
export function getChecklistItemsByType(productType: ProductType, subType?: string): string[] {
  switch (productType) {
    case "APAR":
      return ["Hose", "Pressure", "Handle", "Body", "Safety Pin", "Exp Date"];
    case "HYDRANT":
      if (subType === "HPE") return HYDRANT_HPE_ITEMS.map(i => i.item);
      if (subType === "HPO") return HYDRANT_HPO_ITEMS.map(i => i.item);
      return HYDRANT_HPO_ITEMS.map(i => i.item); // Default to HPO
    case "FIRE_ALARM":
      return FIRE_ALARM_ITEMS.map(i => i.item);
    case "CCTV":
      return ["Resolution", "Lens", "Night Vision", "Power", "Connectivity", "Pan", "Tilt", "Storage Capacity"];
    case "ACCESS_DOOR":
      return ["Material", "Lock Type", "Width", "Height", "Opening Speed"];
    case "PATROL_GUARD":
      return ["Device Type", "Battery Life", "Connectivity", "Patrol Interval", "Firmware Version"];
    default:
      return [];
  }
}

/**
 * Gets checklist items with detail for Hydrant and Fire Alarm
 * Returns array of { item, detail } objects
 */
export function getChecklistItemsWithDetail(productType: ProductType, subType?: string): Array<{ item: string; detail: string }> {
  switch (productType) {
    case "HYDRANT":
      if (subType === "HPE") return HYDRANT_HPE_ITEMS;
      if (subType === "HPO") return HYDRANT_HPO_ITEMS;
      return HYDRANT_HPO_ITEMS;
    case "FIRE_ALARM":
      return FIRE_ALARM_ITEMS;
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