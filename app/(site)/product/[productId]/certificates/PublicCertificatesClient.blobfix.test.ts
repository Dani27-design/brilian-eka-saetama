import { readFileSync } from "fs";
import { resolve } from "path";

describe("BUG-006: Blob URLs must be revoked before creating new ones", () => {
  const sourceFilePath = resolve(__dirname, "PublicCertificatesClient.tsx");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  it("should revoke old blob URLs inside generatePdfBlobUrls before creating new ones", () => {
    // Find the generatePdfBlobUrls function body
    const funcMatch = sourceCode.match(
      /generatePdfBlobUrls\s*=\s*async\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*\};/
    );
    expect(funcMatch).not.toBeNull();

    if (funcMatch) {
      const funcBody = funcMatch[1];
      // Must contain revokeObjectURL BEFORE createObjectURL
      const revokeIndex = funcBody.indexOf("revokeObjectURL");
      const createIndex = funcBody.indexOf("createObjectURL");

      expect(revokeIndex).toBeGreaterThan(-1);
      expect(createIndex).toBeGreaterThan(-1);
      expect(revokeIndex).toBeLessThan(createIndex);
    }
  });

  it("should revoke pdfBlobUrls values specifically", () => {
    // The revoke should iterate over existing pdfBlobUrls
    const funcMatch = sourceCode.match(
      /generatePdfBlobUrls\s*=\s*async\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*\};/
    );
    expect(funcMatch).not.toBeNull();

    if (funcMatch) {
      const funcBody = funcMatch[1];
      // Should reference pdfBlobUrls in the revoke section
      const hasRevokeOfExisting =
        funcBody.includes("pdfBlobUrls") && funcBody.includes("revokeObjectURL");
      expect(hasRevokeOfExisting).toBe(true);
    }
  });

  it("should not have raw error objects in console.error", () => {
    const lines = sourceCode.split("\n");
    for (const line of lines) {
      if (line.trim().startsWith("//")) continue;
      if (line.includes("console.error(")) {
        const badPattern = /console\.error\([^)]*,\s*\n?\s*(error|err)\s*,?\s*\)/;
        if (badPattern.test(line)) {
          throw new Error(
            `Found raw error object in console.error: ${line.trim()}`
          );
        }
      }
    }
    // Also check multiline console.error patterns
    const multilineConsoleError = sourceCode.match(
      /console\.error\(\s*\n?\s*`[^`]*`,\s*\n?\s*(error|err)\s*,?\s*\)/g
    );
    if (multilineConsoleError) {
      throw new Error(
        `Found raw error object in multiline console.error: ${multilineConsoleError[0]}`
      );
    }
  });
});
