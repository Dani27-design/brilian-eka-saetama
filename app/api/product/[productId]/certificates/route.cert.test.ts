import { readFileSync } from "fs";
import { resolve } from "path";

describe("DB-002: Certificates API batch loading", () => {
  const sourceFilePath = resolve(__dirname, "route.ts");
  let sourceCode: string;
  let loopContent: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");

    // Extract loop content: from "for (const maintenanceDoc of paginatedMaintenances)"
    // to the matching closing brace (the line with just "    }" before "// Prepare product info")
    const loopStartMarker = "for (const maintenanceDoc of paginatedMaintenances)";
    const loopEndMarker = "// Prepare product info";

    const startIndex = sourceCode.indexOf(loopStartMarker);
    const endIndex = sourceCode.indexOf(loopEndMarker);

    if (startIndex !== -1 && endIndex !== -1) {
      loopContent = sourceCode.substring(startIndex, endIndex);
    } else {
      loopContent = "";
    }
  });

  it("should NOT have getDoc inside the paginatedMaintenances loop for contracts", () => {
    // The loop should NOT contain getDoc(maintenance.contract)
    expect(loopContent).not.toContain("getDoc(maintenance.contract)");
  });

  it("should NOT have getDoc inside the loop for customers", () => {
    // The loop should NOT contain getDoc(contractData.customer)
    expect(loopContent).not.toContain("getDoc(contractData.customer)");
  });

  it("should NOT have getDoc inside the loop for engineers", () => {
    // The loop should NOT contain getDoc(engineerRef)
    expect(loopContent).not.toContain("getDoc(engineerRef)");
  });

  it("should NOT have getDoc inside the loop for approvers", () => {
    // The loop should NOT contain getDoc(maintenance.updatedBy)
    expect(loopContent).not.toContain("getDoc(maintenance.updatedBy)");
  });

  it("should use batch loading with Promise.all before the loop", () => {
    // Batch loading should happen BEFORE the for loop
    const promiseAllIndex = sourceCode.lastIndexOf("Promise.all");
    const forLoopIndex = sourceCode.indexOf("for (const maintenanceDoc of paginatedMaintenances)");

    expect(promiseAllIndex).toBeGreaterThan(-1);
    expect(forLoopIndex).toBeGreaterThan(-1);
    expect(promiseAllIndex).toBeLessThan(forLoopIndex);
  });

  it("should use Map for lookup data", () => {
    // Batch loaded data should be stored in Maps for O(1) lookups
    expect(sourceCode).toMatch(/new Map|Map</);
  });

  it("should still have getDoc for the initial product fetch (not in loop)", () => {
    // The single product fetch at the top should remain
    expect(sourceCode).toContain('getDoc(productRef)');
  });
});
