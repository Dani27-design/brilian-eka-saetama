/**
 * UI-116: Pagination Arrow SVG Standardization Tests
 *
 * These tests verify that all admin pages with pagination use consistent
 * SVG chevron icons instead of HTML entities (&lt; / &gt;).
 *
 * Reference pattern (from users/page.tsx and blogs/page.tsx):
 * - Left chevron:  d="M15 19l-7-7 7-7"
 * - Right chevron: d="M9 5l7 7-7 7"
 *
 * Pages to fix:
 * - products/page.tsx (lines 922, 939)
 * - customers/page.tsx (lines 542, 559)
 * - contracts/page.tsx (lines 452, 469)
 * - maintenances/page.tsx (lines 687, 701)
 *
 * Reference pages (already correct):
 * - users/page.tsx
 * - blogs/page.tsx
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const ADMIN_DIR = resolve(__dirname);

function readPage(page: string): string {
  return readFileSync(resolve(ADMIN_DIR, page, "page.tsx"), "utf-8");
}

// Standard SVG paths for pagination arrows
const LEFT_CHEVRON_PATH = "M15 19l-7-7 7-7";
const RIGHT_CHEVRON_PATH = "M9 5l7 7-7 7";

// Pages that need to be fixed (currently use HTML entities)
const pagesToFix = ["products", "customers", "contracts", "maintenances"];

// Reference pages (already use SVG - must stay GREEN)
const referencePages = ["users", "blogs"];

// All pages that should have SVG pagination arrows
const allPaginationPages = [...referencePages, ...pagesToFix];

describe("UI-116: Pagination arrow SVG standardization", () => {
  describe("Pages to fix - SVG path presence", () => {
    for (const page of pagesToFix) {
      describe(`${page}/page.tsx`, () => {
        it("should contain left chevron SVG path (M15 19l-7-7 7-7)", () => {
          const source = readPage(page);
          expect(source).toContain(LEFT_CHEVRON_PATH);
        });

        it("should contain right chevron SVG path (M9 5l7 7-7 7)", () => {
          const source = readPage(page);
          expect(source).toContain(RIGHT_CHEVRON_PATH);
        });
      });
    }
  });

  describe("Pages to fix - HTML entity absence", () => {
    for (const page of pagesToFix) {
      describe(`${page}/page.tsx`, () => {
        it("should NOT contain &lt; HTML entity", () => {
          const source = readPage(page);
          expect(source).not.toContain("&lt;");
        });

        it("should NOT contain &gt; HTML entity", () => {
          const source = readPage(page);
          expect(source).not.toContain("&gt;");
        });
      });
    }
  });

  describe("Reference pages - backward compatibility (must stay GREEN)", () => {
    for (const page of referencePages) {
      describe(`${page}/page.tsx`, () => {
        it("should contain left chevron SVG path (M15 19l-7-7 7-7)", () => {
          const source = readPage(page);
          expect(source).toContain(LEFT_CHEVRON_PATH);
        });

        it("should contain right chevron SVG path (M9 5l7 7-7 7)", () => {
          const source = readPage(page);
          expect(source).toContain(RIGHT_CHEVRON_PATH);
        });

        it("should NOT contain &lt; HTML entity", () => {
          const source = readPage(page);
          expect(source).not.toContain("&lt;");
        });

        it("should NOT contain &gt; HTML entity", () => {
          const source = readPage(page);
          expect(source).not.toContain("&gt;");
        });
      });
    }
  });

  describe("Cross-page consistency", () => {
    it("all 6 pagination pages should use the same left chevron path", () => {
      for (const page of allPaginationPages) {
        const source = readPage(page);
        expect(source).toContain(LEFT_CHEVRON_PATH);
      }
    });

    it("all 6 pagination pages should use the same right chevron path", () => {
      for (const page of allPaginationPages) {
        const source = readPage(page);
        expect(source).toContain(RIGHT_CHEVRON_PATH);
      }
    });

    it("no page should use HTML entities for pagination arrows", () => {
      for (const page of allPaginationPages) {
        const source = readPage(page);
        // Check for &lt; and &gt; which are HTML entities for < and >
        expect(source).not.toContain("&lt;");
        expect(source).not.toContain("&gt;");
      }
    });
  });
});
