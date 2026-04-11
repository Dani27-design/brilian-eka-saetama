/**
 * ContractFilters Component Tests
 *
 * Uses static file analysis pattern (readFileSync + regex) in Node.js environment.
 * Tests verify component file structure without requiring jsdom or React rendering.
 */

import * as fs from "fs";
import * as path from "path";

describe("ContractFilters Component", () => {
  const componentPath = path.join(__dirname, "ContractFilters.tsx");
  const pagePath = path.join(
    __dirname,
    "../../../app/(admin)/admin/contracts/page.tsx"
  );

  describe("Component File Structure", () => {
    let componentContent: string;

    beforeAll(() => {
      componentContent = fs.readFileSync(componentPath, "utf-8");
    });

    test("component file exists at correct path", () => {
      expect(fs.existsSync(componentPath)).toBe(true);
    });

    test('contains "Filter Lanjutan" toggle button text', () => {
      expect(componentContent).toContain("Filter Lanjutan");
    });

    test("contains chevron SVG icon path for toggle", () => {
      // Chevron down path: M19 9l-7 7-7-7
      expect(componentContent).toMatch(/M19\s*9l-7\s*7-7-7/);
    });

    test("contains orange dot indicator class (bg-orange-400)", () => {
      expect(componentContent).toContain("bg-orange-400");
    });

    test("contains collapsible section styling classes", () => {
      // Must have: rounded-lg border border-stroke bg-gray-50 p-4
      expect(componentContent).toContain("rounded-lg");
      expect(componentContent).toContain("border-stroke");
      expect(componentContent).toContain("bg-gray-50");
      expect(componentContent).toContain("p-4");
    });

    test("contains Reset/Clear Filters button", () => {
      // Should have either "Clear Filters" or "Reset" button
      const hasResetButton =
        componentContent.includes("Clear Filters") ||
        componentContent.includes("Reset Filter") ||
        componentContent.includes("onClearFilters");
      expect(hasResetButton).toBe(true);
    });

    test("contains status filter options (active/inactive/terminated)", () => {
      expect(componentContent).toMatch(/active|Aktif/i);
      expect(componentContent).toMatch(/inactive|Tidak Aktif/i);
      expect(componentContent).toMatch(/terminated|Dihentikan/i);
    });

    test("contains contract type filter options", () => {
      // Should have service, maintenance, rental, sales, other
      const hasServiceType =
        componentContent.includes("service") ||
        componentContent.includes("Service");
      const hasMaintenanceType =
        componentContent.includes("maintenance") ||
        componentContent.includes("Maintenance");
      expect(hasServiceType).toBe(true);
      expect(hasMaintenanceType).toBe(true);
    });

    test("contains customer filter", () => {
      expect(componentContent).toMatch(/customer|Customer|pelanggan|Pelanggan/i);
    });

    test("exports ContractFilters interface", () => {
      expect(componentContent).toMatch(/export\s+interface\s+ContractFilters/);
    });

    test("exports default component function", () => {
      expect(componentContent).toMatch(/export\s+default\s+function/);
    });
  });

  describe("Page Integration", () => {
    let pageContent: string;

    beforeAll(() => {
      pageContent = fs.readFileSync(pagePath, "utf-8");
    });

    test("page imports ContractFilters component", () => {
      const hasImport =
        pageContent.includes("ContractFiltersComponent") ||
        pageContent.includes("from \"@/components/Admin/Contracts/ContractFilters\"") ||
        pageContent.includes("from '@/components/Admin/Contracts/ContractFilters'");
      expect(hasImport).toBe(true);
    });

    test("page uses ContractFilters component", () => {
      const usesFilterComponent =
        pageContent.includes("<ContractFiltersComponent") ||
        pageContent.includes("<ContractFilters");
      expect(usesFilterComponent).toBe(true);
    });
  });
});
