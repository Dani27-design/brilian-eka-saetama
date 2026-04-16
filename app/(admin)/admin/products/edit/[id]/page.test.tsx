/**
 * Tests for UI-EDIT: Edit Product page visual alignment
 *
 * Validates that the edit product page uses the unified admin card styling:
 * - Outer wrapper has flex h-full flex-col
 * - Form card has rounded-lg, border-white/80, shadow-sm
 * - Submit button text is preserved
 */

import { readFileSync } from "fs";
import { resolve } from "path";

describe("Edit Product Page — Visual Alignment", () => {
  const sourceFilePath = resolve(__dirname, "page.tsx");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  it("should render without syntax errors (file is readable)", () => {
    expect(sourceCode).toBeDefined();
    expect(sourceCode.length).toBeGreaterThan(0);
    expect(sourceCode).toContain("export default function EditProductPage");
  });

  it("should have outer wrapper with flex h-full flex-col classes", () => {
    // Find the main return statement's first div (outer wrapper)
    // Skip the loading return: if (loading) return <div...
    const mainReturnMatch = sourceCode.match(/return\s*\(\s*<div\s+className="([^"]*)"\s*>\s*\{\/\* Enhanced Header/);
    expect(mainReturnMatch).not.toBeNull();
    const outerClasses = mainReturnMatch![1];
    expect(outerClasses).toContain("flex");
    expect(outerClasses).toContain("h-full");
    expect(outerClasses).toContain("flex-col");
  });

  it("should have form card with rounded-lg, border-white/80, shadow-sm classes", () => {
    // The form container should have the unified card styling
    // Current: shadow-default rounded-sm border border-stroke
    // Expected: rounded-lg border-white/80 shadow-sm
    const formCardMatch = sourceCode.match(/<div\s+className="[^"]*shadow-[^"]*rounded-[^"]*border[^"]*bg-white[^"]*p-4/);
    expect(formCardMatch).not.toBeNull();
    const cardLine = formCardMatch![0];
    expect(cardLine).toContain("rounded-lg");
    expect(cardLine).toContain("border-white/80");
    expect(cardLine).toContain("shadow-sm");
  });

  it("should have submit button with correct text", () => {
    // Verify the submit button text is preserved
    expect(sourceCode).toContain('Simpan Produk');
    expect(sourceCode).toContain('type="submit"');
  });
});
