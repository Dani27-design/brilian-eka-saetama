import { readFileSync } from "fs";
import { resolve } from "path";

describe("Unused dependencies removed", () => {
  it("should not have @react-pdf/renderer in package.json", () => {
    const packageJson = readFileSync(resolve(__dirname, "../package.json"), "utf-8");
    expect(packageJson).not.toContain("@react-pdf/renderer");
  });

  it("should still have jsPDF (the actually used PDF library)", () => {
    const packageJson = readFileSync(resolve(__dirname, "../package.json"), "utf-8");
    expect(packageJson).toContain("jspdf");
  });

  it("should not have swr in package.json (ARCH-008 — unused)", () => {
    const packageJson = readFileSync(resolve(__dirname, "../package.json"), "utf-8");
    expect(packageJson).not.toMatch(/"swr":/);
  });

  it("should still have @tanstack/react-query (the actually used data fetching library)", () => {
    const packageJson = readFileSync(resolve(__dirname, "../package.json"), "utf-8");
    expect(packageJson).toContain("@tanstack/react-query");
  });
});
