import { readFileSync } from "fs";
import { resolve } from "path";

describe("BUG-004: Division by zero in dashboard analytics", () => {
  const sourceFilePath = resolve(__dirname, "DashboardClient.tsx");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  it("should not divide pageViews by visitors without a zero check", () => {
    // The buggy pattern: Number(...pageViews...) / Number(...visitors...) without guard
    // Should NOT have bare division that could result in Infinity
    const lines = sourceCode.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Look for the old pattern: .toFixed(1) || "N/A" which doesn't catch Infinity
      if (
        line.includes('.toFixed(1) || "N/A"') ||
        line.includes(".toFixed(1) || 'N/A'")
      ) {
        fail(
          `Found unguarded division with toFixed fallback at line ${i + 1}: ${line}`,
        );
      }
    }
  });

  it("should have a zero/guard check before dividing by visitors", () => {
    // The fix should check visitors > 0 before dividing
    // Look for a pattern like: visitors > 0, visitors !== 0, visitors != 0, or similar guard
    const hasGuard =
      sourceCode.includes("visitors > 0") ||
      sourceCode.includes("visitors !== 0") ||
      sourceCode.includes("visitors != 0") ||
      sourceCode.includes("visitors === 0") ||
      sourceCode.includes("visitors > 0 ?");
    expect(hasGuard).toBe(true);
  });

  it("should display a fallback value when visitors is zero", () => {
    // When visitors is 0, should show "0" or "N/A" or similar, not "Infinity"
    // The ternary should have a fallback branch
    const hasFallback =
      sourceCode.includes('? "0"') ||
      sourceCode.includes(': "0"') ||
      sourceCode.includes('? "N/A"') ||
      sourceCode.includes(': "N/A"') ||
      sourceCode.includes("? '0'") ||
      sourceCode.includes(": '0'");
    expect(hasFallback).toBe(true);
  });
});
