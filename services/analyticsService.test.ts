import { readFileSync } from "fs";
import { resolve } from "path";

describe("BUG-009: Phantom visitor in analytics count", () => {
  const sourceFilePath = resolve(__dirname, "analyticsService.ts");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  describe("visitors Set handling", () => {
    it("should not add empty string to visitors Set", () => {
      // The buggy pattern: visitors.add(... || "")
      // This adds empty string to the Set when value is undefined
      expect(sourceCode).not.toMatch(/visitors\.add\([^)]*\|\|\s*["']["']\s*\)/);
    });

    it("should guard against undefined before adding to visitors Set", () => {
      // The fix should check the value exists before adding
      // Look for a pattern like: if (value) { visitors.add(value) }
      // or: const val = ...; if (val) visitors.add(val);
      const visitorAddSection = sourceCode.match(/visitors\.add\(/);
      expect(visitorAddSection).not.toBeNull();

      // The line with visitors.add should NOT have a fallback to empty string
      const lines = sourceCode.split("\n");
      const addLine = lines.find((l) => l.includes("visitors.add("));
      if (addLine) {
        expect(addLine).not.toContain('|| ""');
        expect(addLine).not.toContain("|| ''");
      }
    });
  });

  describe("console.error sanitization", () => {
    it("should not have raw error objects in console.error", () => {
      const lines = sourceCode.split("\n");
      for (const line of lines) {
        if (line.trim().startsWith("//")) continue;
        if (line.includes("console.error(")) {
          // Pattern matches: console.error(..., error) or console.error(..., err)
          // where error/err is the raw error object, not error.message
          const badPattern = /console\.error\([^)]*,\s*(error|err)\s*\)/;
          if (badPattern.test(line)) {
            throw new Error(
              `Found raw error object in console.error: ${line.trim()}`
            );
          }
        }
      }
    });

    it("should use error.message or error.name instead of raw error object", () => {
      const lines = sourceCode.split("\n");
      const consoleErrorLines = lines.filter(
        (l) => l.includes("console.error(") && !l.trim().startsWith("//")
      );

      // There should be console.error calls in the file
      expect(consoleErrorLines.length).toBeGreaterThan(0);

      // Each console.error that logs an error should use .message or .name
      // or just log a string message without the error object
      for (const line of consoleErrorLines) {
        // If the line contains error/err variable, it should use .message or similar
        if (/[,\s](error|err)[,\s)]/.test(line)) {
          const hasPropertyAccess =
            /error\.(message|name|stack)/.test(line) ||
            /err\.(message|name|stack)/.test(line);
          const hasStringOnly = !/[,\s](error|err)[,\s)]/.test(line);

          expect(hasPropertyAccess || hasStringOnly).toBe(true);
        }
      }
    });
  });
});
