import { readFileSync } from "fs";
import { resolve } from "path";

describe("Maintenance create overlap validation", () => {
  const sourceFilePath = resolve(__dirname, "page.tsx");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  it("uses the shared maintenance overlap validator", () => {
    expect(sourceCode).toContain("@/utils/maintenanceOverlapValidator");
    expect(sourceCode).toContain("assertNoMaintenanceOverlap");
    expect(sourceCode).toContain("MaintenanceOverlapError");
  });

  it("checks overlap per selected product", () => {
    const overlapBlockStart = sourceCode.indexOf("for (const product of selectedProducts)");
    const addDocStart = sourceCode.indexOf("await Promise.all");

    expect(overlapBlockStart).toBeGreaterThan(-1);
    expect(addDocStart).toBeGreaterThan(overlapBlockStart);

    const overlapBlock = sourceCode.substring(overlapBlockStart, addDocStart);
    expect(overlapBlock).toContain('doc(firestore, "products", product.id)');
    expect(overlapBlock).toContain("productRef");
    expect(overlapBlock).toContain("assertNoMaintenanceOverlap");
  });

  it("does not use the old contract-only startDate inequality overlap blocker", () => {
    expect(sourceCode).not.toContain('where("startDate", "<="');
    expect(sourceCode).not.toContain("newStartTimestamp");
    expect(sourceCode).not.toContain("newEndTimestamp");
    expect(sourceCode).not.toContain("Maintenance untuk kontrak ini sudah ada dalam periode yang dipilih");
  });
});
