/**
 * MaintenanceStatus Type Tests
 * UI-114: Status Badge Standardization
 *
 * Tests that MaintenanceStatus type includes the new `in_progress` status
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const TYPES_DIR = resolve(__dirname);
const MAINTENANCES_TYPE_PATH = resolve(TYPES_DIR, "maintenances.ts");

describe("UI-114: MaintenanceStatus type definition", () => {
  describe("in_progress status", () => {
    it("should include in_progress in MaintenanceStatus union type", () => {
      const source = readFileSync(MAINTENANCES_TYPE_PATH, "utf-8");
      // The type definition should contain "in_progress" as a literal type
      expect(source).toContain('"in_progress"');
    });

    it("should have in_progress as part of MaintenanceStatus type", () => {
      const source = readFileSync(MAINTENANCES_TYPE_PATH, "utf-8");
      // Find the MaintenanceStatus type definition and verify in_progress is in it
      const maintenanceStatusMatch = source.match(
        /export type MaintenanceStatus\s*=[\s\S]*?;/
      );
      expect(maintenanceStatusMatch).not.toBeNull();
      if (maintenanceStatusMatch) {
        expect(maintenanceStatusMatch[0]).toContain("in_progress");
      }
    });
  });

  describe("existing statuses preserved", () => {
    it("should still include scheduled status", () => {
      const source = readFileSync(MAINTENANCES_TYPE_PATH, "utf-8");
      expect(source).toContain('"scheduled"');
    });

    it("should still include pending status", () => {
      const source = readFileSync(MAINTENANCES_TYPE_PATH, "utf-8");
      expect(source).toContain('"pending"');
    });

    it("should still include waiting_approval status", () => {
      const source = readFileSync(MAINTENANCES_TYPE_PATH, "utf-8");
      expect(source).toContain('"waiting_approval"');
    });

    it("should still include approved status", () => {
      const source = readFileSync(MAINTENANCES_TYPE_PATH, "utf-8");
      expect(source).toContain('"approved"');
    });

    it("should still include rejected status", () => {
      const source = readFileSync(MAINTENANCES_TYPE_PATH, "utf-8");
      expect(source).toContain('"rejected"');
    });
  });
});
