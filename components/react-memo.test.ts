import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const MEMO_TARGETS = [
  { path: "Site/FAQ/FAQItem.tsx", name: "FAQItem" },
  { path: "Site/Blog/BlogItem.tsx", name: "BlogItem" },
  { path: "Site/OurServices/SingleService.tsx", name: "SingleService" },
  { path: "Admin/Customers/CustomerListItem.tsx", name: "CustomerListItem" },
  { path: "Admin/Inspections/InspectionsTable.tsx", name: "InspectionsTable" },
  { path: "Admin/Inspections/PhotoGalleryModal.tsx", name: "PhotoGalleryModal" },
  { path: "Admin/Inspections/ExportDataModal.tsx", name: "ExportDataModal" },
  { path: "Admin/Inspections/CertificateModal.tsx", name: "CertificateModal" },
  { path: "ScrollReveal.tsx", name: "ScrollReveal" },
];

describe("PERF-007: React.memo on high-value components", () => {
  for (const target of MEMO_TARGETS) {
    it(`${target.name} should be wrapped with React.memo`, () => {
      const filePath = resolve(__dirname, target.path);
      expect(existsSync(filePath)).toBe(true);
      const source = readFileSync(filePath, "utf-8");
      // Should have React.memo or memo( in export default
      const hasMemo = source.includes("React.memo(") || source.includes("memo(");
      expect(hasMemo).toBe(true);
    });
  }
});
