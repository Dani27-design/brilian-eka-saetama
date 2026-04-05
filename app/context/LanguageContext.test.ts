import { readFileSync } from "fs";
import { resolve } from "path";

describe("PERF-003: Language change should not reload the page", () => {
  const sourceFilePath = resolve(__dirname, "LanguageContext.tsx");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  it("should NOT use window.location.reload()", () => {
    expect(sourceCode).not.toContain("window.location.reload()");
  });

  it("should import useRouter from next/navigation", () => {
    expect(sourceCode).toMatch(
      /import\s*\{[^}]*useRouter[^}]*\}\s*from\s*["']next\/navigation["']/
    );
  });

  it("should use router.refresh() instead of full reload", () => {
    expect(sourceCode).toContain("router.refresh()");
  });
});
