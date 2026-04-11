import { readFileSync } from "fs";
import { resolve } from "path";

const ADMIN_DIR = resolve(__dirname);

function readPage(page: string): string {
  return readFileSync(resolve(ADMIN_DIR, page, "page.tsx"), "utf-8");
}

/**
 * UI-120: Filter additions and Reset Filter button
 *
 * Contracts page requirements:
 * - Add status filter dropdown (active/inactive/terminated)
 * - Add contractType filter dropdown (service/maintenance/rental/sales/other)
 * - Add customer filter dropdown (dynamic from loaded contracts)
 * - Add "Reset Filter" button that clears status, contractType, customer filters
 * - Reset Filter PRESERVES search text
 *
 * Inspections page requirements:
 * - Change layout from grid to flex flex-wrap items-end gap-4
 * - Add "Reset Filter" button that resets filterProductType to "APAR", clears status and dates
 * - Reset Filter PRESERVES searchTerm
 */

describe("UI-120: Contracts page filter additions", () => {
  describe("Status filter dropdown", () => {
    it("should contain status filter select with 'active' option", () => {
      const source = readPage("contracts");
      // Status dropdown must have option for 'active'
      expect(source).toMatch(/value=["']active["']/);
    });

    it("should contain status filter select with 'inactive' option", () => {
      const source = readPage("contracts");
      // Status dropdown must have option for 'inactive'
      expect(source).toMatch(/value=["']inactive["']/);
    });

    it("should contain status filter select with 'terminated' option", () => {
      const source = readPage("contracts");
      // Status dropdown must have option for 'terminated'
      expect(source).toMatch(/value=["']terminated["']/);
    });

    it("should have filterStatus state variable", () => {
      const source = readPage("contracts");
      // Must have useState for filterStatus
      expect(source).toMatch(/useState.*filterStatus|filterStatus.*useState/);
    });
  });

  describe("ContractType filter dropdown", () => {
    it("should contain contractType filter select with 'service' option", () => {
      const source = readPage("contracts");
      expect(source).toMatch(/value=["']service["']/);
    });

    it("should contain contractType filter select with 'maintenance' option", () => {
      const source = readPage("contracts");
      expect(source).toMatch(/value=["']maintenance["']/);
    });

    it("should contain contractType filter select with 'rental' option", () => {
      const source = readPage("contracts");
      expect(source).toMatch(/value=["']rental["']/);
    });

    it("should contain contractType filter select with 'sales' option", () => {
      const source = readPage("contracts");
      expect(source).toMatch(/value=["']sales["']/);
    });

    it("should contain contractType filter select with 'other' option", () => {
      const source = readPage("contracts");
      expect(source).toMatch(/value=["']other["']/);
    });

    it("should have filterContractType state variable", () => {
      const source = readPage("contracts");
      // Must have useState for filterContractType
      expect(source).toMatch(/useState.*filterContractType|filterContractType.*useState/);
    });
  });

  describe("Customer filter dropdown", () => {
    it("should contain customer filter select element", () => {
      const source = readPage("contracts");
      // Must have a select for customer filtering - look for customer-related select
      // Could be filterCustomer, selectedCustomer, or similar
      expect(source).toMatch(/filterCustomer|selectedCustomer|customerFilter/);
    });

    it("should have filterCustomer state variable", () => {
      const source = readPage("contracts");
      // Must have useState for filterCustomer
      expect(source).toMatch(/useState.*filterCustomer|filterCustomer.*useState/);
    });
  });

  describe("Reset Filter button", () => {
    it("should contain 'Reset Filter' button label", () => {
      const source = readPage("contracts");
      // Button must have exact text "Reset Filter"
      expect(source).toContain("Reset Filter");
    });

    it("should contain resetFilters function or inline handler", () => {
      const source = readPage("contracts");
      // Must have a reset function or onClick handler that resets filters
      expect(source).toMatch(/resetFilters|onClick=\{.*set.*Filter.*\(""\)/);
    });

    it("should NOT reset searchTerm in reset handler", () => {
      const source = readPage("contracts");
      // First, verify Reset Filter exists (prerequisite for this test)
      expect(source).toContain("Reset Filter");

      // The reset function/handler should NOT contain setSearchTerm("")
      // Find the reset function body
      const resetMatch = source.match(/const resetFilters.*?=.*?\{[\s\S]*?\};|resetFilters[\s\S]*?\{[\s\S]*?\}/);
      if (resetMatch) {
        expect(resetMatch[0]).not.toContain('setSearchTerm("")');
        expect(resetMatch[0]).not.toContain("setSearchTerm('')");
      }
      // Also check inline onClick handlers don't reset searchTerm
      // If Reset Filter button has inline handler, it should not touch searchTerm
      const inlineResetMatch = source.match(/Reset Filter[\s\S]*?onClick=\{[^}]+\}/);
      if (inlineResetMatch) {
        expect(inlineResetMatch[0]).not.toContain('setSearchTerm("")');
        expect(inlineResetMatch[0]).not.toContain("setSearchTerm('')");
      }
    });
  });
});

describe("UI-120: Inspections page filter layout and Reset Filter", () => {
  describe("Filter layout", () => {
    it("should use flex flex-wrap items-end gap-4 for filter section", () => {
      const source = readPage("inspections");
      // Filter section must use flex layout, not grid
      expect(source).toContain("flex flex-wrap items-end gap-4");
    });

    it("should NOT use grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 for filter section", () => {
      const source = readPage("inspections");
      // Old grid layout must be removed from filter section
      expect(source).not.toContain("grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4");
    });
  });

  describe("Reset Filter button", () => {
    it("should contain 'Reset Filter' button label", () => {
      const source = readPage("inspections");
      // Button must have exact text "Reset Filter"
      expect(source).toContain("Reset Filter");
    });

    it("should reset filterProductType to 'APAR' (default value)", () => {
      const source = readPage("inspections");
      // Reset handler must set filterProductType to "APAR", not empty string
      // Look for setFilterProductType("APAR") in reset context
      expect(source).toMatch(/setFilterProductType\(["']APAR["']\)/);
    });

    it("should NOT reset searchTerm in reset handler", () => {
      const source = readPage("inspections");
      // First, verify Reset Filter exists (prerequisite for this test)
      expect(source).toContain("Reset Filter");

      // The reset function/handler should NOT contain setSearchTerm("")
      const resetMatch = source.match(/const resetFilters.*?=.*?\{[\s\S]*?\};|resetFilters[\s\S]*?\{[\s\S]*?\}/);
      if (resetMatch) {
        expect(resetMatch[0]).not.toContain('setSearchTerm("")');
        expect(resetMatch[0]).not.toContain("setSearchTerm('')");
      }
      // Also check inline onClick handlers
      const inlineResetMatch = source.match(/Reset Filter[\s\S]*?onClick=\{[^}]+\}/);
      if (inlineResetMatch) {
        expect(inlineResetMatch[0]).not.toContain('setSearchTerm("")');
        expect(inlineResetMatch[0]).not.toContain("setSearchTerm('')");
      }
    });

    it("should contain resetFilters function or inline reset handler", () => {
      const source = readPage("inspections");
      // Must have a reset function or onClick handler
      expect(source).toMatch(/resetFilters|onClick=\{.*set.*Filter/);
    });
  });
});

describe("UI-120: Cross-page filter consistency", () => {
  it("both contracts and inspections pages should use flex flex-wrap items-end gap-4 for filter layout", () => {
    const contractsSource = readPage("contracts");
    const inspectionsSource = readPage("inspections");

    // Both pages must have the standard filter layout
    expect(contractsSource).toContain("flex flex-wrap items-end gap-4");
    expect(inspectionsSource).toContain("flex flex-wrap items-end gap-4");
  });

  it("neither page should reset search text in Reset Filter handler", () => {
    const contractsSource = readPage("contracts");
    const inspectionsSource = readPage("inspections");

    // First, verify Reset Filter exists on both pages (prerequisite for this test)
    expect(contractsSource).toContain("Reset Filter");
    expect(inspectionsSource).toContain("Reset Filter");

    // Contracts page reset should not touch searchTerm
    const contractsResetMatch = contractsSource.match(/resetFilters[\s\S]*?\{[\s\S]*?\}|onClick=\{\s*\(\)\s*=>\s*\{[\s\S]*?Reset Filter/);
    if (contractsResetMatch) {
      expect(contractsResetMatch[0]).not.toMatch(/setSearchTerm\s*\(\s*["']["']\s*\)/);
    }

    // Inspections page reset should not touch searchTerm
    const inspectionsResetMatch = inspectionsSource.match(/resetFilters[\s\S]*?\{[\s\S]*?\}|onClick=\{\s*\(\)\s*=>\s*\{[\s\S]*?Reset Filter/);
    if (inspectionsResetMatch) {
      expect(inspectionsResetMatch[0]).not.toMatch(/setSearchTerm\s*\(\s*["']["']\s*\)/);
    }
  });

  it("both pages should have Reset Filter button with standard styling", () => {
    const contractsSource = readPage("contracts");
    const inspectionsSource = readPage("inspections");

    // Both pages must have the Reset Filter button with correct styling
    // Standard: rounded-lg border border-stroke px-4 py-2 text-xs font-medium hover:bg-gray-100
    const resetButtonPattern = /Reset Filter[\s\S]*?className="[^"]*rounded-lg[^"]*border[^"]*border-stroke/;

    expect(contractsSource).toMatch(resetButtonPattern);
    expect(inspectionsSource).toMatch(resetButtonPattern);
  });
});
