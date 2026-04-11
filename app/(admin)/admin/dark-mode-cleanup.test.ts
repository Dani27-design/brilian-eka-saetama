/**
 * UI-112: Admin Dashboard Dark Mode Dead Code Removal
 *
 * Tests verify that:
 * 1. Admin scope has zero dark: class occurrences (must FAIL before cleanup, PASS after)
 * 2. Public site dark mode is preserved (must PASS before AND after cleanup)
 * 3. Shared/excluded files are unchanged (must PASS before AND after cleanup)
 *
 * Test approach: File system scanning with regex pattern matching.
 * Similar to ui-standards.test.ts pattern.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { resolve, join, extname } from "path";

const WEBSITE_ROOT = resolve(__dirname, "../../..");
const ADMIN_APP_DIR = resolve(WEBSITE_ROOT, "app/(admin)");
const ADMIN_COMPONENTS_DIR = resolve(WEBSITE_ROOT, "components/Admin");
const SITE_APP_DIR = resolve(WEBSITE_ROOT, "app/(site)");
const SITE_COMPONENTS_DIR = resolve(WEBSITE_ROOT, "components/Site");
const LINES_DIR = resolve(WEBSITE_ROOT, "components/Lines");
const ERROR_PAGES_DIR = resolve(WEBSITE_ROOT, "components/ErrorPages");
const GLOBALS_CSS = resolve(WEBSITE_ROOT, "app/globals.css");

// Pattern to match Tailwind dark: variant classes (e.g., dark:bg-gray-800, dark:text-white)
// Excludes JavaScript object properties like { dark: "" } or dark: bgData.dark
// Tailwind dark: is always followed by a utility name (letters, then usually a dash or bracket)
const DARK_CLASS_PATTERN = /dark:[a-z]+[-\[]/gi;

// File extensions to scan (exclude test files to avoid counting the test itself)
const SCANNABLE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".css"];
const TEST_FILE_PATTERN = /\.test\.(tsx?|jsx?|css)$/;

/**
 * Recursively collect all files with scannable extensions from a directory
 */
function collectFiles(dir: string): string[] {
  const files: string[] = [];

  if (!existsSync(dir)) {
    return files;
  }

  function walk(currentDir: string): void {
    const entries = readdirSync(currentDir);
    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (
        stat.isFile() &&
        SCANNABLE_EXTENSIONS.includes(extname(entry)) &&
        !TEST_FILE_PATTERN.test(entry)
      ) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Count dark: class occurrences in a file
 */
function countDarkClasses(filePath: string): number {
  if (!existsSync(filePath)) {
    return 0;
  }
  const content = readFileSync(filePath, "utf-8");
  const matches = content.match(DARK_CLASS_PATTERN);
  return matches ? matches.length : 0;
}

/**
 * Count total dark: occurrences across all files in a directory
 */
function countDarkClassesInDirectory(dir: string): { total: number; files: { path: string; count: number }[] } {
  const files = collectFiles(dir);
  const results: { path: string; count: number }[] = [];
  let total = 0;

  for (const file of files) {
    const count = countDarkClasses(file);
    if (count > 0) {
      results.push({ path: file, count });
      total += count;
    }
  }

  return { total, files: results };
}

describe("UI-112: Admin Dashboard Dark Mode Dead Code Removal", () => {
  describe("AC-1: Admin scope should have zero dark: classes", () => {
    describe("app/(admin)/** directory", () => {
      it("should contain zero dark: class occurrences", () => {
        const result = countDarkClassesInDirectory(ADMIN_APP_DIR);

        // This test will FAIL before cleanup (expect 601 occurrences currently)
        // After cleanup, this should PASS (0 occurrences)
        expect(result.total).toBe(0);
      });
    });

    describe("components/Admin/** directory", () => {
      it("should contain zero dark: class occurrences", () => {
        const result = countDarkClassesInDirectory(ADMIN_COMPONENTS_DIR);

        // This test will FAIL before cleanup (expect 958 occurrences currently)
        // After cleanup, this should PASS (0 occurrences)
        expect(result.total).toBe(0);
      });
    });
  });

  describe("AC-3: Public site dark mode should be preserved", () => {
    describe("app/(site)/** directory", () => {
      it("should still contain dark: classes (dark mode functional)", () => {
        const result = countDarkClassesInDirectory(SITE_APP_DIR);

        // This test should PASS before AND after cleanup
        // Public site must retain dark mode functionality
        expect(result.total).toBeGreaterThan(0);
      });

      it("should have at least 15 dark: class occurrences", () => {
        const result = countDarkClassesInDirectory(SITE_APP_DIR);

        // Current count is 20, set threshold slightly below to allow minor changes
        // but catch accidental removal
        expect(result.total).toBeGreaterThanOrEqual(15);
      });
    });

    describe("components/Site/** directory", () => {
      it("should still contain dark: classes (dark mode functional)", () => {
        const result = countDarkClassesInDirectory(SITE_COMPONENTS_DIR);

        // This test should PASS before AND after cleanup
        expect(result.total).toBeGreaterThan(0);
      });

      it("should have at least 150 dark: class occurrences", () => {
        const result = countDarkClassesInDirectory(SITE_COMPONENTS_DIR);

        // Current count is 164, set threshold to catch accidental removal
        expect(result.total).toBeGreaterThanOrEqual(150);
      });
    });

    describe("globals.css", () => {
      it("should still contain dark: styles", () => {
        const count = countDarkClasses(GLOBALS_CSS);

        // globals.css must not be modified
        expect(count).toBeGreaterThan(0);
      });

      it("should have at least 20 dark: style occurrences", () => {
        const count = countDarkClasses(GLOBALS_CSS);

        // Current count is 22, set threshold to catch accidental removal
        expect(count).toBeGreaterThanOrEqual(20);
      });
    });
  });

  describe("AC-4: Shared utility files should be preserved", () => {
    describe("components/Lines/** directory", () => {
      it("should still contain dark: classes if they existed before", () => {
        const result = countDarkClassesInDirectory(LINES_DIR);

        // Current count is 3, these must not be removed
        // This test should PASS before AND after cleanup
        expect(result.total).toBeGreaterThanOrEqual(3);
      });
    });

    describe("components/ErrorPages/** directory", () => {
      it("should still contain dark: classes", () => {
        const result = countDarkClassesInDirectory(ERROR_PAGES_DIR);

        // Current count is 22, these must not be removed
        expect(result.total).toBeGreaterThan(0);
      });

      it("should have at least 20 dark: class occurrences", () => {
        const result = countDarkClassesInDirectory(ERROR_PAGES_DIR);

        // Current count is 22, set threshold to catch accidental removal
        expect(result.total).toBeGreaterThanOrEqual(20);
      });
    });
  });

  describe("Boundary verification: Admin vs Site separation", () => {
    it("admin cleanup should not affect site dark mode count", () => {
      // This is a meta-test to ensure we are checking the right directories
      // It documents the expected state and will catch misconfiguration

      const siteAppCount = countDarkClassesInDirectory(SITE_APP_DIR).total;
      const siteComponentsCount = countDarkClassesInDirectory(SITE_COMPONENTS_DIR).total;
      const globalsCssCount = countDarkClasses(GLOBALS_CSS);

      // Total site dark mode classes should remain substantial
      const totalSiteClasses = siteAppCount + siteComponentsCount + globalsCssCount;
      expect(totalSiteClasses).toBeGreaterThanOrEqual(185);
    });

    it("admin and site directories should be correctly identified as separate", () => {
      // Verify path separation
      expect(ADMIN_APP_DIR).not.toContain("(site)");
      expect(ADMIN_COMPONENTS_DIR).not.toContain("Site");
      expect(SITE_APP_DIR).not.toContain("(admin)");
      expect(SITE_COMPONENTS_DIR).not.toContain("Admin");
    });
  });
});
