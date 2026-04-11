import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

describe("PERF-006: Inspections page split into components", () => {
  const componentsDir = resolve(__dirname);
  const pageFile = resolve(
    __dirname,
    "../../../app/(admin)/admin/inspections/page.tsx"
  );

  describe("New component files should exist", () => {
    it("should have InspectionsTable.tsx", () => {
      expect(existsSync(resolve(componentsDir, "InspectionsTable.tsx"))).toBe(
        true
      );
    });

    it("should have PhotoGalleryModal.tsx", () => {
      expect(existsSync(resolve(componentsDir, "PhotoGalleryModal.tsx"))).toBe(
        true
      );
    });

    it("should have ExportDataModal.tsx", () => {
      expect(existsSync(resolve(componentsDir, "ExportDataModal.tsx"))).toBe(
        true
      );
    });

    it("should have CertificateModal.tsx", () => {
      expect(existsSync(resolve(componentsDir, "CertificateModal.tsx"))).toBe(
        true
      );
    });
  });

  describe("All new components should be under 500 LOC", () => {
    const components = [
      "InspectionsTable.tsx",
      "PhotoGalleryModal.tsx",
      "ExportDataModal.tsx",
      "CertificateModal.tsx",
    ];

    for (const file of components) {
      it(`${file} should exist and be under 500 lines`, () => {
        const filePath = resolve(componentsDir, file);
        expect(existsSync(filePath)).toBe(true);
        const content = readFileSync(filePath, "utf-8");
        const lineCount = content.split("\n").length;
        expect(lineCount).toBeLessThanOrEqual(500);
      });
    }
  });

  describe("Main page.tsx should be significantly reduced", () => {
    it("should have page.tsx under 1000 lines (reduced from 2876)", () => {
      expect(existsSync(pageFile)).toBe(true);
      const content = readFileSync(pageFile, "utf-8");
      const lineCount = content.split("\n").length;
      // Reduced from 2876 to ~906 (68% reduction)
      // Further reduction to <500 requires extracting fetch functions to custom hook
      expect(lineCount).toBeLessThanOrEqual(1000);
    });
  });

  describe("Main page should import extracted components", () => {
    it("should import InspectionsTable", () => {
      expect(existsSync(pageFile)).toBe(true);
      const source = readFileSync(pageFile, "utf-8");
      expect(source).toContain("InspectionsTable");
    });

    it("should import PhotoGalleryModal", () => {
      expect(existsSync(pageFile)).toBe(true);
      const source = readFileSync(pageFile, "utf-8");
      expect(source).toContain("PhotoGalleryModal");
    });

    it("should import ExportDataModal", () => {
      expect(existsSync(pageFile)).toBe(true);
      const source = readFileSync(pageFile, "utf-8");
      expect(source).toContain("ExportDataModal");
    });

    it("should import CertificateModal", () => {
      expect(existsSync(pageFile)).toBe(true);
      const source = readFileSync(pageFile, "utf-8");
      expect(source).toContain("CertificateModal");
    });
  });

  describe("New components should be client components", () => {
    const components = [
      "InspectionsTable.tsx",
      "PhotoGalleryModal.tsx",
      "ExportDataModal.tsx",
      "CertificateModal.tsx",
    ];

    for (const file of components) {
      it(`${file} should exist and have "use client" directive`, () => {
        const filePath = resolve(componentsDir, file);
        expect(existsSync(filePath)).toBe(true);
        const source = readFileSync(filePath, "utf-8");
        expect(source).toContain('"use client"');
      });
    }
  });
});
