/**
 * SEC-013: Test endpoints removed from production
 *
 * These tests verify that all test/debug endpoints, components, and pages
 * have been removed from the production codebase. Each test checks for
 * the non-existence of a file that was previously used for testing purposes.
 *
 * All tests should be RED (failing) before the fix is applied, because
 * the files currently exist and will be deleted.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

describe("SEC-013: Test endpoints removed from production", () => {
  describe("Test error API routes should not exist", () => {
    it("should not have test-error/500 route", () => {
      const routePath = resolve(__dirname, "500/route.ts");
      expect(existsSync(routePath)).toBe(false);
    });

    it("should not have test-error/404 route", () => {
      const routePath = resolve(__dirname, "404/route.ts");
      expect(existsSync(routePath)).toBe(false);
    });

    it("should not have test-error/503 route", () => {
      const routePath = resolve(__dirname, "503/route.ts");
      expect(existsSync(routePath)).toBe(false);
    });

    it("should not have test-error/timeout route", () => {
      const routePath = resolve(__dirname, "timeout/route.ts");
      expect(existsSync(routePath)).toBe(false);
    });

    it("should not have test-error/invalid-json route", () => {
      const routePath = resolve(__dirname, "invalid-json/route.ts");
      expect(existsSync(routePath)).toBe(false);
    });
  });

  describe("Test auth API routes should not exist", () => {
    it("should not have test-auth/unauthorized route", () => {
      const routePath = resolve(__dirname, "../test-auth/unauthorized/route.ts");
      expect(existsSync(routePath)).toBe(false);
    });

    it("should not have test-auth/permission-denied route", () => {
      const routePath = resolve(__dirname, "../test-auth/permission-denied/route.ts");
      expect(existsSync(routePath)).toBe(false);
    });
  });

  describe("Error testing components should not exist", () => {
    it("should not have ErrorSimulator component", () => {
      const componentPath = resolve(
        __dirname,
        "../../../components/ErrorTesting/ErrorSimulator.tsx"
      );
      expect(existsSync(componentPath)).toBe(false);
    });

    it("should not have NetworkErrorSimulator component", () => {
      const componentPath = resolve(
        __dirname,
        "../../../components/ErrorTesting/NetworkErrorSimulator.tsx"
      );
      expect(existsSync(componentPath)).toBe(false);
    });

    it("should not have AuthErrorSimulator component", () => {
      const componentPath = resolve(
        __dirname,
        "../../../components/ErrorTesting/AuthErrorSimulator.tsx"
      );
      expect(existsSync(componentPath)).toBe(false);
    });
  });

  describe("Error test page should not exist", () => {
    it("should not have error-test page", () => {
      const pagePath = resolve(
        __dirname,
        "../../(admin)/admin/error-test/page.tsx"
      );
      expect(existsSync(pagePath)).toBe(false);
    });
  });

  describe("Debug page should not reference removed components", () => {
    it("should not import ErrorTesting components", () => {
      const debugPagePath = resolve(
        __dirname,
        "../../(admin)/admin/debug/page.tsx"
      );

      if (existsSync(debugPagePath)) {
        const source = readFileSync(debugPagePath, "utf-8");
        expect(source).not.toContain("ErrorTesting");
        expect(source).not.toContain("error-test");
      }
    });
  });
});
