import { readFileSync } from "fs";
import { resolve } from "path";

describe("BUG-005: Bulk import success count accuracy", () => {
  const sourceFilePath = resolve(__dirname, "bulkOperations.ts");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  it("should NOT use BATCH_SIZE for success counting", () => {
    // The buggy pattern: result.success += BATCH_SIZE
    expect(sourceCode).not.toContain("result.success += BATCH_SIZE");
  });

  it("should track actual operations per batch", () => {
    // Should have an array to track batch sizes
    const hasBatchSizes = sourceCode.includes("batchSizes") ||
                          sourceCode.includes("batchCounts") ||
                          sourceCode.includes("operationsPerBatch");
    expect(hasBatchSizes).toBe(true);
  });

  it("should NOT use Math.min to approximate success count", () => {
    // The old workaround: Math.min(result.success, products.length - result.failed - result.skipped)
    // This should be removed since counts are now accurate
    const hasMathMinWorkaround = /Math\.min\s*\(\s*result\.success/.test(sourceCode);
    expect(hasMathMinWorkaround).toBe(false);
  });

  it("should not have raw error objects in console.error", () => {
    const lines = sourceCode.split("\n");
    for (const line of lines) {
      if (line.trim().startsWith("//")) continue;
      if (line.includes("console.error(")) {
        const badPattern = /console\.error\([^)]*,\s*(error|err)\s*\)/;
        if (badPattern.test(line)) {
          throw new Error(`Found raw error object in console.error: ${line.trim()}`);
        }
      }
    }
  });

  it("should not auto-reschedule maintenance from bulk product updates", () => {
    expect(sourceCode).not.toContain("maintenanceIntervalRescheduler");
    expect(sourceCode).not.toContain("buildIntervalReschedulePlan");
    expect(sourceCode).not.toContain("applyIntervalReschedulePlan");
  });
});
