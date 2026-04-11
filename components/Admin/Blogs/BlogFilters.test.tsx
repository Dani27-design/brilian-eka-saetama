/**
 * BlogFilters Component Tests
 *
 * Uses static file analysis pattern (readFileSync + regex) in Node.js environment.
 * Tests verify component file structure without requiring jsdom or React rendering.
 */

import * as fs from "fs";
import * as path from "path";

describe("BlogFilters Component", () => {
  const componentPath = path.join(__dirname, "BlogFilters.tsx");
  const pagePath = path.join(
    __dirname,
    "../../../app/(admin)/admin/blogs/page.tsx"
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

    test("contains author filter", () => {
      expect(componentContent).toMatch(/author|Author/i);
    });

    test("contains date filter inputs", () => {
      // Should have date from/to or startDate/endDate
      const hasDateFilter =
        componentContent.includes('type="date"') ||
        componentContent.includes("startDate") ||
        componentContent.includes("dateFrom");
      expect(hasDateFilter).toBe(true);
    });

    test("exports BlogFilters interface", () => {
      expect(componentContent).toMatch(/export\s+interface\s+BlogFilters/);
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

    test("page imports BlogFilters component", () => {
      const hasImport =
        pageContent.includes("BlogFiltersComponent") ||
        pageContent.includes("from \"@/components/Admin/Blogs/BlogFilters\"") ||
        pageContent.includes("from '@/components/Admin/Blogs/BlogFilters'");
      expect(hasImport).toBe(true);
    });

    test("page uses BlogFilters component", () => {
      const usesFilterComponent =
        pageContent.includes("<BlogFiltersComponent") ||
        pageContent.includes("<BlogFilters");
      expect(usesFilterComponent).toBe(true);
    });
  });
});
