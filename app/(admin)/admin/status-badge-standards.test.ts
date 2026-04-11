/**
 * Status Badge Standards Tests
 * UI-114: Status Badge Standardization
 *
 * Tests that status badges across admin pages follow the standardized pattern:
 * - Pill badge styling (inline-flex rounded-full)
 * - Consistent font weight (font-medium)
 * - Correct colors for each status
 * - in_progress status support with purple color
 * - "Sedang Dikerjakan" display text for in_progress
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const ADMIN_DIR = resolve(__dirname);
const COMPONENTS_DIR = resolve(ADMIN_DIR, "../../../components/Admin");

function readPage(page: string): string {
  return readFileSync(resolve(ADMIN_DIR, page, "page.tsx"), "utf-8");
}

function readComponent(path: string): string {
  return readFileSync(resolve(COMPONENTS_DIR, path), "utf-8");
}

describe("UI-114: Contract status badges", () => {
  describe("contracts/page.tsx badge styling", () => {
    it("should have a statusColor or contractStatusColor mapping object", () => {
      const source = readPage("contracts");
      // Contracts should have a color mapping for statuses
      const hasColorMapping =
        source.includes("statusColor") ||
        source.includes("contractStatusColor") ||
        source.includes("statusColors");
      expect(hasColorMapping).toBe(true);
    });

    it("should use inline-flex rounded-full pill badge pattern for status display", () => {
      const source = readPage("contracts");
      // Status badges should use pill pattern with inline-flex and rounded-full
      // This pattern should appear in the status td cell or in a StatusBadge component
      expect(source).toMatch(/inline-flex[^"]*rounded-full/);
    });

    it("should contain bg-green-100 text-green-800 for active status in status color map", () => {
      const source = readPage("contracts");
      // The active status should have green colors - check they exist together in a status context
      // Look for a status color definition containing both classes
      const hasActiveColors = source.match(
        /active[^}]*bg-green-100[^}]*text-green-800|bg-green-100 text-green-800/
      );
      expect(hasActiveColors).not.toBeNull();
    });

    it("should contain bg-gray-100 text-gray-800 for inactive status in status color map", () => {
      const source = readPage("contracts");
      // The inactive status should have gray colors
      const hasInactiveColors = source.match(
        /inactive[^}]*bg-gray-100[^}]*text-gray-800|bg-gray-100 text-gray-800/
      );
      expect(hasInactiveColors).not.toBeNull();
    });

    it("should contain bg-red-100 text-red-800 for terminated status in status color map", () => {
      const source = readPage("contracts");
      // The terminated status should have red colors
      const hasTerminatedColors = source.match(
        /terminated[^}]*bg-red-100[^}]*text-red-800|bg-red-100 text-red-800/
      );
      expect(hasTerminatedColors).not.toBeNull();
    });

    it("should NOT use bare capitalize class for status display (old pattern)", () => {
      const source = readPage("contracts");
      // Find the status cell - look for capitalize without proper badge styling
      // The old pattern was: <td className="px-4 py-3 capitalize">
      const oldPatternMatch = source.match(
        /<td[^>]*className="[^"]*px-4 py-3 capitalize[^"]*">/
      );
      expect(oldPatternMatch).toBeNull();
    });
  });
});

describe("UI-114: Maintenance status badges", () => {
  describe("maintenances/page.tsx badge styling", () => {
    it("should use inline-flex rounded-full pattern for status badges (NOT inline-block rounded)", () => {
      const source = readPage("maintenances");
      // The status badge span should use inline-flex rounded-full pattern
      // Check that the status display span has the pill badge pattern
      const hasPillBadge = source.match(
        /statusColor\[.*?\].*?inline-flex[^"]*rounded-full|<span[^>]*className="[^"]*inline-flex[^"]*rounded-full[^"]*\${statusColor/
      );
      expect(hasPillBadge).not.toBeNull();
    });

    it("should use font-medium class for status badges (NOT font-semibold)", () => {
      const source = readPage("maintenances");
      // The status badge span should use font-medium, not font-semibold
      // Currently uses inline-block rounded px-2 py-1 text-xs font-semibold - this should change
      const hasFontMediumBadge = source.match(
        /statusColor\[.*?\].*?font-medium|<span[^>]*className="[^"]*font-medium[^"]*\${statusColor/
      );
      expect(hasFontMediumBadge).not.toBeNull();
    });

    it("should contain in_progress in statusColor map", () => {
      const source = readPage("maintenances");
      // The statusColor object should have in_progress key
      const statusColorMatch = source.match(
        /statusColor[^}]*in_progress[^}]*}/s
      );
      expect(statusColorMatch).not.toBeNull();
    });

    it("should contain bg-purple-100 text-purple-700 for in_progress in statusColor map", () => {
      const source = readPage("maintenances");
      // The in_progress status should have purple colors in the statusColor map
      const hasPurpleInProgress = source.match(
        /in_progress[^,}]*bg-purple-100[^,}]*text-purple-700|in_progress:\s*["']bg-purple-100 text-purple-700/
      );
      expect(hasPurpleInProgress).not.toBeNull();
    });

    it('should contain "Sedang Dikerjakan" display text for in_progress in statusDisplay map', () => {
      const source = readPage("maintenances");
      // The statusDisplay map should have in_progress mapped to "Sedang Dikerjakan"
      const hasInProgressDisplay = source.match(
        /in_progress[^,}]*Sedang Dikerjakan|statusDisplay[^}]*in_progress:\s*["']Sedang Dikerjakan/
      );
      expect(hasInProgressDisplay).not.toBeNull();
    });

    it("should contain in_progress in statusDisplay map", () => {
      const source = readPage("maintenances");
      // The statusDisplay object should have in_progress key
      const statusDisplayMatch = source.match(
        /statusDisplay[^}]*in_progress[^}]*}/s
      );
      expect(statusDisplayMatch).not.toBeNull();
    });
  });

  describe("maintenances/page.tsx StatusBadge usage", () => {
    it("should import or use StatusBadge component or inline the standard pattern", () => {
      const source = readPage("maintenances");
      // Should either import StatusBadge or have the standard inline-flex rounded-full pattern
      const usesStatusBadge =
        source.includes("import StatusBadge") ||
        source.includes("<StatusBadge") ||
        source.match(/inline-flex[^"]*rounded-full[^"]*px-2[^"]*py-1[^"]*text-xs[^"]*font-medium/);
      expect(usesStatusBadge).toBeTruthy();
    });
  });
});

describe("UI-114: InspectionsTable status badges", () => {
  describe("InspectionsTable.tsx badge styling", () => {
    it("should contain in_progress in statusColors map", () => {
      const source = readComponent("Inspections/InspectionsTable.tsx");
      // The statusColors object should have in_progress key
      const statusColorsMatch = source.match(
        /statusColors[^}]*in_progress[^}]*}/s
      );
      expect(statusColorsMatch).not.toBeNull();
    });

    it("should contain bg-purple-100 text-purple-700 for in_progress in statusColors map", () => {
      const source = readComponent("Inspections/InspectionsTable.tsx");
      // The in_progress status should have purple colors in the statusColors map
      const hasPurpleInProgress = source.match(
        /in_progress[^,}]*bg-purple-100[^,}]*text-purple-700|in_progress:\s*["']bg-purple-100 text-purple-700/
      );
      expect(hasPurpleInProgress).not.toBeNull();
    });

    it('should contain "Sedang Dikerjakan" display text for in_progress in statusDisplay map', () => {
      const source = readComponent("Inspections/InspectionsTable.tsx");
      // The statusDisplay map should have in_progress mapped to "Sedang Dikerjakan"
      const hasInProgressDisplay = source.match(
        /in_progress[^,}]*Sedang Dikerjakan|statusDisplay[^}]*in_progress:\s*["']Sedang Dikerjakan/
      );
      expect(hasInProgressDisplay).not.toBeNull();
    });

    it("should contain in_progress in statusDisplay map", () => {
      const source = readComponent("Inspections/InspectionsTable.tsx");
      // The statusDisplay object should have in_progress key
      const statusDisplayMatch = source.match(
        /statusDisplay[^}]*in_progress[^}]*}/s
      );
      expect(statusDisplayMatch).not.toBeNull();
    });
  });

  describe("InspectionsTable.tsx StatusBadge usage", () => {
    it("should import or use StatusBadge component or inline the standard pattern", () => {
      const source = readComponent("Inspections/InspectionsTable.tsx");
      // Should either import StatusBadge or have the standard inline-flex rounded-full pattern
      const usesStatusBadge =
        source.includes("import StatusBadge") ||
        source.includes("<StatusBadge") ||
        source.match(/inline-flex[^"]*rounded-full[^"]*px-2[^"]*py-1[^"]*text-xs[^"]*font-medium/);
      expect(usesStatusBadge).toBeTruthy();
    });
  });
});

describe("UI-114: Cross-page consistency", () => {
  it("maintenances statusColor should have in_progress with purple colors", () => {
    const maintenancesSource = readPage("maintenances");

    // Should have in_progress in statusColor map
    const hasInProgress = maintenancesSource.match(
      /statusColor[^}]*in_progress[^}]*}/s
    );
    expect(hasInProgress).not.toBeNull();

    // Should have purple color scheme for in_progress
    const hasPurple = maintenancesSource.match(
      /in_progress[^,}]*bg-purple-100/
    );
    expect(hasPurple).not.toBeNull();
  });

  it("InspectionsTable statusColors should have in_progress with purple colors", () => {
    const inspectionsSource = readComponent("Inspections/InspectionsTable.tsx");

    // Should have in_progress in statusColors map
    const hasInProgress = inspectionsSource.match(
      /statusColors[^}]*in_progress[^}]*}/s
    );
    expect(hasInProgress).not.toBeNull();

    // Should have purple color scheme for in_progress
    const hasPurple = inspectionsSource.match(
      /in_progress[^,}]*bg-purple-100/
    );
    expect(hasPurple).not.toBeNull();
  });

  it("both pages should display 'Sedang Dikerjakan' for in_progress status", () => {
    const maintenancesSource = readPage("maintenances");
    const inspectionsSource = readComponent("Inspections/InspectionsTable.tsx");

    // Both should have in_progress mapped to "Sedang Dikerjakan" in statusDisplay
    const maintenancesHasDisplay = maintenancesSource.match(
      /statusDisplay[^}]*in_progress[^,}]*Sedang Dikerjakan/s
    );
    const inspectionsHasDisplay = inspectionsSource.match(
      /statusDisplay[^}]*in_progress[^,}]*Sedang Dikerjakan/s
    );

    expect(maintenancesHasDisplay).not.toBeNull();
    expect(inspectionsHasDisplay).not.toBeNull();
  });
});
