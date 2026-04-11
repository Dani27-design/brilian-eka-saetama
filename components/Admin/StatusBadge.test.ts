/**
 * StatusBadge Component Tests
 * UI-114: Status Badge Standardization
 *
 * Tests that the shared StatusBadge component:
 * 1. Exists as a file
 * 2. Exports a default function component
 * 3. Contains standard pill badge classes
 * 4. Accepts status styling props
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const COMPONENT_DIR = resolve(__dirname);
const COMPONENT_PATH = resolve(COMPONENT_DIR, "StatusBadge.tsx");

describe("UI-114: StatusBadge shared component", () => {
  describe("file structure", () => {
    it("should exist at components/Admin/StatusBadge.tsx", () => {
      expect(existsSync(COMPONENT_PATH)).toBe(true);
    });

    it("should export a default function component", () => {
      const source = readFileSync(COMPONENT_PATH, "utf-8");
      // Should have export default function or export default memo(function)
      const hasDefaultExport =
        source.includes("export default function StatusBadge") ||
        source.includes("export default memo(StatusBadge)") ||
        (source.includes("function StatusBadge") &&
          source.includes("export default StatusBadge"));
      expect(hasDefaultExport).toBe(true);
    });
  });

  describe("standard pill badge styling", () => {
    it("should contain inline-flex class for badge layout", () => {
      const source = readFileSync(COMPONENT_PATH, "utf-8");
      expect(source).toContain("inline-flex");
    });

    it("should contain rounded-full class for pill shape", () => {
      const source = readFileSync(COMPONENT_PATH, "utf-8");
      expect(source).toContain("rounded-full");
    });

    it("should contain px-2 class for horizontal padding", () => {
      const source = readFileSync(COMPONENT_PATH, "utf-8");
      expect(source).toContain("px-2");
    });

    it("should contain py-1 class for vertical padding", () => {
      const source = readFileSync(COMPONENT_PATH, "utf-8");
      expect(source).toContain("py-1");
    });

    it("should contain text-xs class for badge text size", () => {
      const source = readFileSync(COMPONENT_PATH, "utf-8");
      expect(source).toContain("text-xs");
    });

    it("should contain font-medium class for text weight", () => {
      const source = readFileSync(COMPONENT_PATH, "utf-8");
      expect(source).toContain("font-medium");
    });
  });

  describe("component props", () => {
    it("should accept status prop for styling determination", () => {
      const source = readFileSync(COMPONENT_PATH, "utf-8");
      // Should have a props interface or type with status
      expect(source).toMatch(/status\s*[?:]?\s*:?\s*\w+/);
    });

    it("should accept children or label prop for display text", () => {
      const source = readFileSync(COMPONENT_PATH, "utf-8");
      // Should have children or label prop
      const hasTextProp =
        source.includes("children") || source.includes("label");
      expect(hasTextProp).toBe(true);
    });

    it("should have a color mapping object or function", () => {
      const source = readFileSync(COMPONENT_PATH, "utf-8");
      // Should have some form of color mapping (colorMap, statusColors, getColor, etc.)
      const hasColorMapping =
        source.includes("colorMap") ||
        source.includes("statusColor") ||
        source.includes("getColor") ||
        source.includes("colors[") ||
        source.includes("colorClasses");
      expect(hasColorMapping).toBe(true);
    });
  });
});
