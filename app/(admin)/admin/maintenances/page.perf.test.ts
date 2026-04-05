import { readFileSync } from "fs";
import { resolve } from "path";

describe("PERF-001: Maintenances page should not use moment.js", () => {
  const sourceFilePath = resolve(__dirname, "page.tsx");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  it("should not import moment", () => {
    expect(sourceCode).not.toMatch(/import\s+moment\s+from\s+["']moment["']/);
    expect(sourceCode).not.toContain('from "moment"');
    expect(sourceCode).not.toContain("moment/locale");
  });

  it("should not call moment()", () => {
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

  it("should use date-fns for date formatting", () => {
    expect(sourceCode).toContain("date-fns");
  });
});
