import { readFileSync } from "fs";
import { resolve } from "path";

describe("PERF-002: ServerHero console sanitization", () => {
  const sourceFilePath = resolve(__dirname, "ServerHero.tsx");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  it("should already use Promise.all for parallel fetches", () => {
    expect(sourceCode).toContain("Promise.all");
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
});
