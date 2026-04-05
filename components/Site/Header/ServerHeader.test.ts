import { readFileSync } from "fs";
import { resolve } from "path";

describe("PERF-002: ServerHeader uses parallel fetches", () => {
  const sourceFilePath = resolve(__dirname, "ServerHeader.tsx");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  it("should use Promise.all for batch fetching header data", () => {
    expect(sourceCode).toContain("Promise.all");
  });

  it("should NOT have sequential awaits for header doc fetches", () => {
    // The old pattern had 3 separate "await adminFirestore" calls in sequence
    // After fix, there should be only 1 Promise.all wrapping all 3
    const getHeaderFunc = sourceCode.match(
      /async function getHeaderData[\s\S]*?return headerData;\s*\}/
    );
    expect(getHeaderFunc).not.toBeNull();
    if (getHeaderFunc) {
      // Count standalone "await adminFirestore" calls (not inside Promise.all)
      // After fix, fetches should be inside Promise.all, not standalone awaits
      const funcBody = getHeaderFunc[0];
      const awaitAdminCalls = funcBody.match(/await\s+adminFirestore\s*\n?\s*\.collection/g);
      // Should have 0 standalone await adminFirestore calls (all inside Promise.all)
      expect(awaitAdminCalls).toBeNull();
    }
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
