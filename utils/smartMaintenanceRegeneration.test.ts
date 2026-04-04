import { readFileSync } from "fs";
import { resolve } from "path";

describe("BUG-010: Firestore Timestamp assumption fix", () => {
  const sourceFilePath = resolve(__dirname, "smartMaintenanceRegeneration.ts");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  describe("Safe date conversion", () => {
    it("should not call .toDate() directly on maintenance fields", () => {
      // The buggy pattern: m.startDate.toDate() or m.endDate.toDate()
      // These assume Firestore Timestamp and crash on Date objects
      expect(sourceCode).not.toMatch(/m\.startDate\.toDate\(\)/);
      expect(sourceCode).not.toMatch(/m\.endDate\.toDate\(\)/);
    });

    it("should have a safe date conversion helper", () => {
      // Should have a function that handles Timestamp, Date, string, number
      const hasHelper =
        sourceCode.includes("instanceof Timestamp") &&
        sourceCode.includes("instanceof Date");
      expect(hasHelper).toBe(true);
    });
  });

  describe("No debug console.log statements", () => {
    it("should not have any console.log in the file", () => {
      const lines = sourceCode.split("\n");
      const logLines = lines.filter(
        (line) =>
          line.includes("console.log(") && !line.trim().startsWith("//")
      );
      expect(logLines).toEqual([]);
    });
  });

  describe("Console.error sanitization", () => {
    it("should not have raw error objects in console.error", () => {
      const lines = sourceCode.split("\n");
      for (const line of lines) {
        if (line.trim().startsWith("//")) continue;
        if (line.includes("console.error(")) {
          // Pattern: console.error(..., error) or console.error(..., err) or console.error(..., productError)
          const badPattern =
            /console\.error\([^)]*,\s*(error|err|productError)\s*\)/;
          if (badPattern.test(line)) {
            throw new Error(
              `Found raw error object in console.error: ${line.trim()}`
            );
          }
        }
      }
    });
  });
});
