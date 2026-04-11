import { readFileSync } from "fs";
import { resolve } from "path";

describe("DB-004: Maintenance generation uses batch writes", () => {
  const sourceFilePath = resolve(__dirname, "contractMaintenanceGenerator.ts");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  it("should import writeBatch from firebase/firestore", () => {
    expect(sourceCode).toMatch(/import\s*\{[^}]*writeBatch[^}]*\}\s*from\s*["']firebase\/firestore["']/);
  });

  it("should NOT use addDoc for sequential writes", () => {
    // addDoc is sequential - should be replaced with writeBatch
    expect(sourceCode).not.toContain("addDoc");
  });

  it("should use writeBatch and batch.commit()", () => {
    expect(sourceCode).toContain("writeBatch");
    expect(sourceCode).toContain("batch.commit()");
  });

  it("should use Promise.all for parallel product fetches", () => {
    expect(sourceCode).toContain("Promise.all");
  });

  it("should not have debug console.log", () => {
    const lines = sourceCode.split("\n");
    const logLines = lines.filter(
      (line) => line.includes("console.log(") && !line.trim().startsWith("//")
    );
    expect(logLines).toEqual([]);
  });

  it("should not have raw error objects in console.error", () => {
    const lines = sourceCode.split("\n");
    for (const line of lines) {
      if (line.trim().startsWith("//")) continue;
      if (line.includes("console.error(")) {
        const badPattern = /console\.error\([^)]*,\s*(error|err|productError)\s*\)/;
        if (badPattern.test(line)) {
          throw new Error(`Found raw error object in console.error: ${line.trim()}`);
        }
      }
    }
  });
});
