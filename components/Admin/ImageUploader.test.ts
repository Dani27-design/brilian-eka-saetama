import { readFileSync } from "fs";
import { resolve } from "path";

describe("BUG-012: Error cleared on new file selection", () => {
  const sourceFilePath = resolve(__dirname, "ImageUploader.tsx");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  it("should clear error at the start of handleFileChange", () => {
    // Find handleFileChange function and check setError(null) comes before validation
    const funcMatch = sourceCode.match(
      /handleFileChange\s*=\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*\};/
    );
    expect(funcMatch).not.toBeNull();

    if (funcMatch) {
      const funcBody = funcMatch[1];
      const setErrorNullIndex = funcBody.indexOf("setError(null)");
      const validationIndex = funcBody.indexOf("file.type.match");

      expect(setErrorNullIndex).toBeGreaterThan(-1);
      expect(validationIndex).toBeGreaterThan(-1);
      expect(setErrorNullIndex).toBeLessThan(validationIndex);
    }
  });

  it("should not have any console.log in the file", () => {
    const lines = sourceCode.split("\n");
    const logLines = lines.filter(
      (line) =>
        line.includes("console.log(") &&
        !line.trim().startsWith("//")
    );
    expect(logLines).toEqual([]);
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
