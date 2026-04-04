import { readFileSync } from "fs";
import { resolve } from "path";

describe("BUG-007: Stale closure fix in keyboard handler", () => {
  const sourceFilePath = resolve(__dirname, "PublicCertificatesClient.tsx");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  it("should import useCallback from React", () => {
    expect(sourceCode).toMatch(
      /import\s*\{[^}]*useCallback[^}]*\}\s*from\s*["']react["']/
    );
  });

  it("should use useCallback for handlePrevious", () => {
    expect(sourceCode).toMatch(/handlePrevious\s*=\s*useCallback\s*\(/);
  });

  it("should use useCallback for handleNext", () => {
    expect(sourceCode).toMatch(/handleNext\s*=\s*useCallback\s*\(/);
  });

  it("should use functional setState in handlePrevious (prev => ...)", () => {
    // handlePrevious should use setCurrentCertificateIndex((prev) => ...)
    // instead of setCurrentCertificateIndex(currentCertificateIndex - 1)
    const funcMatch = sourceCode.match(
      /handlePrevious\s*=\s*useCallback\s*\(\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*,/
    );
    if (funcMatch) {
      expect(funcMatch[1]).toMatch(/setCurrentCertificateIndex\s*\(\s*\(?\s*prev/);
      expect(funcMatch[1]).not.toContain("currentCertificateIndex - 1");
    } else {
      fail("handlePrevious useCallback not found");
    }
  });

  it("should use functional setState in handleNext (prev => ...)", () => {
    // handleNext should use setCurrentCertificateIndex((prev) => ...)
    // instead of setCurrentCertificateIndex(currentCertificateIndex + 1)
    const funcMatch = sourceCode.match(
      /handleNext\s*=\s*useCallback\s*\(\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*,/
    );
    if (funcMatch) {
      expect(funcMatch[1]).toMatch(/setCurrentCertificateIndex\s*\(\s*\(?\s*prev/);
      expect(funcMatch[1]).not.toContain("currentCertificateIndex + 1");
    } else {
      fail("handleNext useCallback not found");
    }
  });

  it("should NOT have currentCertificateIndex in keyboard useEffect dependencies", () => {
    // The keyboard useEffect should depend on [handlePrevious, handleNext]
    // NOT on [currentCertificateIndex, data]
    const keyboardEffect = sourceCode.match(
      /addEventListener\s*\(\s*["']keydown["'][\s\S]*?removeEventListener\s*\(\s*["']keydown["'][\s\S]*?\}\s*,\s*\[([^\]]*)\]/
    );
    expect(keyboardEffect).not.toBeNull();
    if (keyboardEffect) {
      expect(keyboardEffect[1]).not.toContain("currentCertificateIndex");
      expect(keyboardEffect[1]).toContain("handlePrevious");
      expect(keyboardEffect[1]).toContain("handleNext");
    }
  });
});
