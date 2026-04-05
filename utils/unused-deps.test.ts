import { readFileSync } from "fs";
import { resolve } from "path";

describe("PERF-005: Unused @react-pdf/renderer removed", () => {
  it("should not have @react-pdf/renderer in package.json", () => {
    const packageJson = readFileSync(resolve(__dirname, "../package.json"), "utf-8");
    expect(packageJson).not.toContain("@react-pdf/renderer");
  });

  it("should still have jsPDF (the actually used PDF library)", () => {
    const packageJson = readFileSync(resolve(__dirname, "../package.json"), "utf-8");
    expect(packageJson).toContain("jspdf");
  });
});
