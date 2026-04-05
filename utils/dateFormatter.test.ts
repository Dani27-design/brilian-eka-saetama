import { readFileSync } from "fs";
import { resolve } from "path";

describe("PERF-001: dateFormatter should not use moment.js", () => {
  const sourceFilePath = resolve(__dirname, "dateFormatter.ts");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  it("should not import moment", () => {
    expect(sourceCode).not.toMatch(/import\s+moment\s+from\s+["']moment["']/);
    expect(sourceCode).not.toContain('from "moment"');
    expect(sourceCode).not.toContain("from 'moment'");
  });

  it("should not call moment()", () => {
    // No moment() calls should exist
    const lines = sourceCode.split("\n");
    const momentCalls = lines.filter(
      (line) =>
        line.includes("moment(") &&
        !line.trim().startsWith("//") &&
        !line.includes('"moment"') &&
        !line.includes("'moment'")
    );
    expect(momentCalls).toEqual([]);
  });

  it("should still export formatToWIB function", () => {
    expect(sourceCode).toContain("export function formatToWIB");
  });

  it("should still export formatDateOnlyWIB function", () => {
    expect(sourceCode).toContain("export function formatDateOnlyWIB");
  });

  it("should still export formatTimeOnlyWIB function", () => {
    expect(sourceCode).toContain("export function formatTimeOnlyWIB");
  });

  it("should not have raw error objects in console.error or console.warn", () => {
    const lines = sourceCode.split("\n");
    for (const line of lines) {
      if (line.trim().startsWith("//")) continue;
      if (line.includes("console.error(") || line.includes("console.warn(")) {
        const badPattern = /console\.(error|warn)\([^)]*,\s*(error|err|date)\s*\)/;
        if (badPattern.test(line)) {
          throw new Error(`Found raw object in console: ${line.trim()}`);
        }
      }
    }
  });
});
