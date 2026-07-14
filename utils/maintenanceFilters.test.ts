import { createDefaultMaintenanceFilters, filterAndSortMaintenances } from "./maintenanceFilters";
import { canUseMaintenanceFirestoreSort } from "./maintenanceQuery";
import type { MaintenanceTableRow } from "./maintenanceDataLoader";
import type { MaintenanceFilters } from "@/components/Admin/Maintenances/MaintenanceFilters";

function maintenanceRow(
  overrides: Partial<MaintenanceTableRow>,
): MaintenanceTableRow {
  return {
    id: "maintenanceA",
    contractNumber: "CTR-001",
    contractName: "Kontrak Maintenance",
    productNumber: "105",
    productName: "Hydrant ULP Ambulu",
    productType: "HYDRANT",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-08-31"),
    status: "approved",
    engineers: [],
    hasInspection: true,
    inspection: { checklist: [] },
    ...overrides,
  };
}

function filters(overrides: Partial<MaintenanceFilters>): MaintenanceFilters {
  return {
    ...createDefaultMaintenanceFilters(),
    month: 0,
    year: 0,
    ...overrides,
  };
}

describe("maintenanceFilters", () => {
  it("includes maintenance when the selected month is inside its start-end range", () => {
    const maintenances = [
      maintenanceRow({
        id: "june-to-august",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-08-31"),
      }),
      maintenanceRow({
        id: "september-only",
        startDate: new Date("2026-09-01"),
        endDate: new Date("2026-09-30"),
      }),
    ];

    const julyResult = filterAndSortMaintenances(
      maintenances,
      filters({ month: 7 }),
    );
    const augustResult = filterAndSortMaintenances(
      maintenances,
      filters({ month: 8 }),
    );

    expect(julyResult.map((maintenance) => maintenance.id)).toEqual([
      "june-to-august",
    ]);
    expect(augustResult.map((maintenance) => maintenance.id)).toEqual([
      "june-to-august",
    ]);
  });

  it("uses month and year together as a period overlap filter", () => {
    const maintenances = [
      maintenanceRow({
        id: "december-to-january",
        startDate: new Date("2026-12-15"),
        endDate: new Date("2027-01-15"),
      }),
      maintenanceRow({
        id: "january-next-year",
        startDate: new Date("2027-01-16"),
        endDate: new Date("2027-01-31"),
      }),
    ];

    const result = filterAndSortMaintenances(
      maintenances,
      filters({ month: 1, year: 2027 }),
    );

    expect(result.map((maintenance) => maintenance.id)).toEqual([
      "december-to-january",
      "january-next-year",
    ]);
  });

  it("uses client-side strategy for month filtering because it requires date range overlap", () => {
    expect(canUseMaintenanceFirestoreSort(filters({ month: 7 }))).toBe(false);
    expect(canUseMaintenanceFirestoreSort(filters({ year: 2026 }))).toBe(false);
  });
});
