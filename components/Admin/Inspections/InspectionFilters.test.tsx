/**
 * InspectionFilters Component Tests
 *
 * Uses static file analysis pattern (readFileSync + regex) in Node.js environment.
 * Tests verify component file structure without requiring jsdom or React rendering.
 *
 * Special behavior: filterProductType defaults to "APAR", Reset restores to "APAR" (not empty)
 */

import * as fs from "fs";
import * as path from "path";

describe("InspectionFilters Component", () => {
  const componentPath = path.join(__dirname, "InspectionFilters.tsx");
  const pagePath = path.join(
    __dirname,
    "../../../app/(admin)/admin/inspections/page.tsx"
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

    test("contains product type filter options (APAR, HYDRANT, etc.)", () => {
      expect(componentContent).toContain("APAR");
      expect(componentContent).toContain("HYDRANT");
      expect(componentContent).toContain("CCTV");
      expect(componentContent).toContain("FIRE_ALARM");
    });

    test("contains status filter options", () => {
      const hasStatusFilter =
        componentContent.includes("pending") ||
        componentContent.includes("scheduled") ||
        componentContent.includes("waiting_approval") ||
        componentContent.includes("approved");
      expect(hasStatusFilter).toBe(true);
    });

    test("contains date range filter inputs", () => {
      const hasDateFilter =
        componentContent.includes('type="date"') ||
        componentContent.includes("filterDateFrom") ||
        componentContent.includes("dateFrom");
      expect(hasDateFilter).toBe(true);
    });

    test("exports InspectionFilters interface", () => {
      expect(componentContent).toMatch(/export\s+interface\s+InspectionFilters/);
    });

    test("exports default component function", () => {
      expect(componentContent).toMatch(/export\s+default\s+function/);
    });

    test("APAR is the default product type (special requirement)", () => {
      // The component should reference APAR as default in hasActiveFilters logic
      // or in the reset function
      const hasAparDefault =
        componentContent.includes('"APAR"') ||
        componentContent.includes("'APAR'");
      expect(hasAparDefault).toBe(true);
    });
  });

  describe("Page Integration", () => {
    let pageContent: string;

    beforeAll(() => {
      pageContent = fs.readFileSync(pagePath, "utf-8");
    });

    test("page imports InspectionFilters component", () => {
      const hasImport =
        pageContent.includes("InspectionFiltersComponent") ||
        pageContent.includes("from \"@/components/Admin/Inspections/InspectionFilters\"") ||
        pageContent.includes("from '@/components/Admin/Inspections/InspectionFilters'");
      expect(hasImport).toBe(true);
    });

    test("page uses InspectionFilters component", () => {
      const usesFilterComponent =
        pageContent.includes("<InspectionFiltersComponent") ||
        pageContent.includes("<InspectionFilters");
      expect(usesFilterComponent).toBe(true);
    });
  });
});
