/**
 * Tests for DB-001: Products page uses batch loading
 *
 * This file tests that the products page has been refactored to use
 * the batch-loading utility instead of N+1 individual getDoc calls.
 * The page should:
 * 1. Import and use enrichProductsWithContracts from productDataLoader
 * 2. NOT have individual getDoc calls inside the fetchProducts function
 * 3. NOT import getDoc (singular) from firebase/firestore
 *
 * NOTE: The refactoring is NOT done yet. Tests should be RED until
 * the developer implements the fix.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

describe("DB-001: Products page uses batch loading", () => {
  const sourceFilePath = resolve(__dirname, "page.tsx");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  it("should import enrichProductsWithContracts from productDataLoader", () => {
    expect(sourceCode).toContain("enrichProductsWithContracts");
    expect(sourceCode).toContain("productDataLoader");
  });

  it("should NOT have N+1 pattern (individual getDoc inside map/loop)", () => {
    // The old N+1 pattern: data.map(async (product) => { ... getDoc(contractRef) ... })
    // Should not have getDoc calls inside the fetchProducts function
    const fetchBlock = sourceCode.match(/fetchProducts\s*=\s*async[\s\S]*?setIsLoading\(false\)/);
    if (fetchBlock) {
      expect(fetchBlock[0]).not.toContain("getDoc(contractRef)");
      expect(fetchBlock[0]).not.toContain("getDoc(contractData.customer)");
    }
  });

  it("should NOT import getDoc from firebase/firestore", () => {
    // getDoc (singular) should be removed since batch loading handles it
    // getDocs (plural) should remain
    const firestoreImport = sourceCode.match(/import\s*\{([^}]*)\}\s*from\s*["']firebase\/firestore["']/);
    if (firestoreImport) {
      const imports = firestoreImport[1];
      // Check if getDoc appears as a standalone import (not as part of getDocs)
      const importList = imports.split(",").map((s: string) => s.trim());
      const hasStandaloneGetDoc = importList.some((i: string) => i === "getDoc");
      expect(hasStandaloneGetDoc).toBe(false);
    }
  });

  it("should call enrichProductsWithContracts with fetched products", () => {
    // The function should call the batch loader with the products array
    expect(sourceCode).toMatch(/enrichProductsWithContracts\s*\(/);
  });

  it("should not have raw error objects in console.error", () => {
    const lines = sourceCode.split("\n");
    for (const line of lines) {
      if (line.trim().startsWith("//")) continue;
      if (line.includes("console.error(")) {
        // Pattern matches: console.error("message", error) or console.error(error)
        const badPattern = /console\.error\([^)]*,\s*(error|err)\s*\)/;
        if (badPattern.test(line)) {
          throw new Error(`Found raw error object in console.error: ${line.trim()}`);
        }
      }
    }
  });
});
