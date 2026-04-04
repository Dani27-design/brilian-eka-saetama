import { readFileSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";

/**
 * SEC-014: Console logging sanitization tests
 *
 * Uses static source code analysis to verify:
 * 1. No console.log exists in any API route files (debug statements removed)
 * 2. No console.error or console.warn passes a raw error object
 *    (should use error.message or error?.message instead)
 */

// Recursively get all .ts files in a directory (excluding test files)
function getApiRouteFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getApiRouteFiles(fullPath));
    } else if (entry.endsWith(".ts") && !entry.includes(".test.")) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("SEC-014: Console logging sanitization", () => {
  const apiDir = resolve(__dirname, "../app/api");
  const authUtilPath = resolve(__dirname, "../utils/auth.ts");
  let apiFiles: string[];
  let allSourceContents: Map<string, string>;

  beforeAll(() => {
    apiFiles = getApiRouteFiles(apiDir);
    allSourceContents = new Map();
    for (const file of apiFiles) {
      allSourceContents.set(file, readFileSync(file, "utf-8"));
    }
    // Also include auth utility
    allSourceContents.set(authUtilPath, readFileSync(authUtilPath, "utf-8"));
  });

  describe("No debug console.log in API routes", () => {
    it("should not have any console.log in API route files", () => {
      const violations: string[] = [];

      for (const [file, content] of allSourceContents) {
        const lines = content.split("\n");
        lines.forEach((line, index) => {
          // Skip commented lines
          if (line.trim().startsWith("//")) return;

          if (line.includes("console.log(")) {
            violations.push(`${file}:${index + 1}: ${line.trim()}`);
          }
        });
      }

      expect(violations).toEqual([]);
    });
  });

  describe("console.error should not log raw error objects", () => {
    it("should not pass raw error variable to console.error", () => {
      // Pattern: console.error("message", error) where error is a bare variable
      // OK: console.error("message", error.message) or console.error("static string")
      // BAD: console.error("message:", error) or console.error("message", error)
      const badPattern = /console\.error\([^)]*,\s*(error|err|e)\s*\)/;
      const violations: string[] = [];

      for (const [file, content] of allSourceContents) {
        const lines = content.split("\n");
        lines.forEach((line, index) => {
          // Skip commented lines
          if (line.trim().startsWith("//")) return;

          if (line.includes("console.error(")) {
            // Allow: console.error("string only")
            // Allow: console.error("msg:", error.message)
            // Allow: console.error("msg:", error?.message)
            // Deny: console.error("msg:", error)
            // Deny: console.error("msg:", err)
            if (badPattern.test(line)) {
              violations.push(`${file}:${index + 1}: ${line.trim()}`);
            }
          }
        });
      }

      expect(violations).toEqual([]);
    });
  });

  describe("console.warn should not log raw error objects", () => {
    it("should not pass raw error variable to console.warn", () => {
      // Extended pattern to catch all error variable names used in the codebase
      const badPattern =
        /console\.warn\([^)]*,\s*(error|err|e|engineerError|approverError|certError|contractError)\s*\)/;
      const violations: string[] = [];

      for (const [file, content] of allSourceContents) {
        const lines = content.split("\n");
        lines.forEach((line, index) => {
          // Skip commented lines
          if (line.trim().startsWith("//")) return;

          if (line.includes("console.warn(")) {
            if (badPattern.test(line)) {
              violations.push(`${file}:${index + 1}: ${line.trim()}`);
            }
          }
        });
      }

      expect(violations).toEqual([]);
    });
  });

  describe("Static string-only console.error is allowed", () => {
    it("should still have Admin Firestore availability check logs", () => {
      const usersRoute = readFileSync(
        resolve(apiDir, "users/route.ts"),
        "utf-8"
      );
      expect(usersRoute).toContain(
        'console.error("Admin Firestore is not available")'
      );
    });
  });
});
