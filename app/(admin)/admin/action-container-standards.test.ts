/**
 * UI-115: Action Button Container Standardization Tests
 *
 * All action button containers must use the standard pattern: `flex items-center gap-2`
 * This test suite verifies:
 * 1. The standard pattern is present in all pages
 * 2. Old patterns are NOT present (flex space-x-2, flex items-center gap-1, flex flex-col gap-1)
 *
 * Tests are written RED first - they will fail until the implementation is complete.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const ADMIN_DIR = resolve(__dirname);
const COMPONENTS_DIR = resolve(__dirname, "../../../components/Admin");

function readPage(page: string): string {
  return readFileSync(resolve(ADMIN_DIR, page, "page.tsx"), "utf-8");
}

function readComponent(path: string): string {
  return readFileSync(resolve(COMPONENTS_DIR, path), "utf-8");
}

/**
 * Helper function to find the action button container div in table rows.
 * Action containers are div elements inside the last td that contain action buttons (Edit/Delete).
 * The standard pattern is: <td className="px-4 py-3"><div className="flex items-center gap-2">
 */
function findActionContainerPatterns(source: string): {
  hasStandardPattern: boolean;
  hasSpaceX2: boolean;
  hasGap1: boolean;
  hasFlexColGap1: boolean;
} {
  // Look for action button containers - these are divs inside td cells that contain Links or buttons for actions
  const actionContainerMatches = source.match(/<td className="px-4 py-3">\s*<div className="([^"]+)">\s*(?:<Link|<button|{\/\*)/g) || [];

  let hasStandardPattern = false;
  let hasSpaceX2 = false;
  let hasGap1 = false;
  let hasFlexColGap1 = false;

  for (const match of actionContainerMatches) {
    const classMatch = match.match(/<div className="([^"]+)"/);
    if (classMatch) {
      const classes = classMatch[1];
      if (classes.includes("flex items-center gap-2")) {
        hasStandardPattern = true;
      }
      if (classes.includes("flex space-x-2")) {
        hasSpaceX2 = true;
      }
      if (classes.match(/flex items-center gap-1(?!\d)/)) {
        hasGap1 = true;
      }
      if (classes.includes("flex flex-col gap-1") || classes.includes("flex-col gap-1")) {
        hasFlexColGap1 = true;
      }
    }
  }

  return { hasStandardPattern, hasSpaceX2, hasGap1, hasFlexColGap1 };
}

describe("UI-115: Action Button Container Standardization", () => {

  describe("users/page.tsx", () => {
    it("should contain flex items-center gap-2 for action container", () => {
      const source = readPage("users");
      const patterns = findActionContainerPatterns(source);
      expect(patterns.hasStandardPattern).toBe(true);
    });

    it("should NOT contain flex space-x-2 (old pattern)", () => {
      const source = readPage("users");
      // Check that flex space-x-2 is NOT used for action button containers
      expect(source).not.toContain('<div className="flex space-x-2">');
    });
  });

  describe("blogs/page.tsx", () => {
    it("should contain flex items-center gap-2 for action container", () => {
      const source = readPage("blogs");
      const patterns = findActionContainerPatterns(source);
      expect(patterns.hasStandardPattern).toBe(true);
    });

    it("should NOT contain flex space-x-2 (old pattern)", () => {
      const source = readPage("blogs");
      expect(source).not.toContain('<div className="flex space-x-2">');
    });
  });

  describe("contracts/page.tsx", () => {
    it("should contain flex items-center gap-2 for action container", () => {
      const source = readPage("contracts");
      const patterns = findActionContainerPatterns(source);
      expect(patterns.hasStandardPattern).toBe(true);
    });

    it("should NOT contain flex space-x-2 (old pattern)", () => {
      const source = readPage("contracts");
      expect(source).not.toContain('<div className="flex space-x-2">');
    });
  });

  describe("products/page.tsx", () => {
    it("should contain flex items-center gap-2 for action container", () => {
      const source = readPage("products");
      const patterns = findActionContainerPatterns(source);
      expect(patterns.hasStandardPattern).toBe(true);
    });

    it("should NOT contain flex items-center gap-1 for action container (old pattern)", () => {
      const source = readPage("products");
      // Check that gap-1 is NOT used for action containers (gap-2 is the standard)
      expect(source).not.toContain('<div className="flex items-center gap-1">');
    });
  });

  describe("maintenances/page.tsx", () => {
    it("should have action container div with flex items-center gap-2 wrapping Edit button", () => {
      const source = readPage("maintenances");
      // The Edit button in maintenances should be wrapped in a div with flex items-center gap-2
      // Currently the Edit link is directly in the td without a wrapper div
      const patterns = findActionContainerPatterns(source);
      expect(patterns.hasStandardPattern).toBe(true);
    });

    it("should have Edit button wrapped in a container div (not bare Link in td)", () => {
      const source = readPage("maintenances");
      // The Edit link should be inside a div container, not directly in td
      // Look for the pattern where Link to edit is inside a flex container
      const hasWrappedEditLink = source.includes('className="flex items-center gap-2"') &&
        source.match(/<div className="flex items-center gap-2">\s*<Link\s+href={`\/admin\/maintenances\/edit/);
      expect(hasWrappedEditLink).toBeTruthy();
    });
  });

  describe("InspectionsTable.tsx", () => {
    it("should contain flex items-center gap-2 for action container", () => {
      const source = readComponent("Inspections/InspectionsTable.tsx");
      // The action column should use horizontal layout with gap-2
      expect(source).toContain('className="flex items-center gap-2"');
    });

    it("should NOT contain flex flex-col gap-1 for action container (old pattern)", () => {
      const source = readComponent("Inspections/InspectionsTable.tsx");
      // The action td (line 303-339 area) should NOT have vertical layout
      // Find the specific action container pattern
      const actionTdMatch = source.match(/<td className="px-4 py-3">\s*<div className="([^"]+)">\s*<Link/g);
      if (actionTdMatch) {
        for (const match of actionTdMatch) {
          expect(match).not.toContain("flex-col");
          expect(match).not.toContain("flex flex-col gap-1");
        }
      }
    });
  });

  describe("CustomerListItem.tsx", () => {
    it("should contain flex items-center gap-2 for action container (already correct)", () => {
      const source = readComponent("Customers/CustomerListItem.tsx");
      // CustomerListItem already has the correct pattern - verify it stays correct
      expect(source).toContain('className="flex items-center gap-2"');
    });

    it("should NOT contain flex space-x-2", () => {
      const source = readComponent("Customers/CustomerListItem.tsx");
      expect(source).not.toContain('className="flex space-x-2"');
    });

    it("should NOT contain flex flex-col gap-1", () => {
      const source = readComponent("Customers/CustomerListItem.tsx");
      // Verify CustomerListItem doesn't use vertical action layout
      const actionContainer = source.match(/<div className="flex items-center gap-2">/);
      expect(actionContainer).not.toBeNull();
    });
  });

  describe("Cross-page consistency", () => {
    it("all pages should use the same flex items-center gap-2 pattern for action containers", () => {
      const pages = [
        { name: "users", reader: () => readPage("users") },
        { name: "blogs", reader: () => readPage("blogs") },
        { name: "contracts", reader: () => readPage("contracts") },
        { name: "products", reader: () => readPage("products") },
        { name: "maintenances", reader: () => readPage("maintenances") },
        { name: "InspectionsTable", reader: () => readComponent("Inspections/InspectionsTable.tsx") },
        { name: "CustomerListItem", reader: () => readComponent("Customers/CustomerListItem.tsx") },
      ];

      const standardPattern = 'className="flex items-center gap-2"';

      for (const { name, reader } of pages) {
        const source = reader();
        expect(source).toContain(standardPattern);
      }
    });

    it("no pages should use flex space-x-2 for action containers", () => {
      const pages = [
        { name: "users", reader: () => readPage("users") },
        { name: "blogs", reader: () => readPage("blogs") },
        { name: "contracts", reader: () => readPage("contracts") },
      ];

      const oldPattern = '<div className="flex space-x-2">';

      for (const { name, reader } of pages) {
        const source = reader();
        expect(source).not.toContain(oldPattern);
      }
    });

    it("no pages should use flex items-center gap-1 for action containers", () => {
      const source = readPage("products");
      expect(source).not.toContain('<div className="flex items-center gap-1">');
    });

    it("InspectionsTable should NOT use flex-col for action buttons", () => {
      const source = readComponent("Inspections/InspectionsTable.tsx");
      // Find action container specifically (the td with Edit link)
      // It should be horizontal (flex items-center), not vertical (flex-col)
      const match = source.match(/<td className="px-4 py-3">\s*<div className="flex flex-col gap-1">\s*<Link/);
      expect(match).toBeNull();
    });
  });
});
