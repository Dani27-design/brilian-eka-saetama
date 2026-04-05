/**
 * Tests for DB-001: Product data loader utility
 *
 * This file tests the batch-loading utility that replaces N+1 queries
 * in the products page. The utility should:
 * 1. Collect unique contract IDs from products
 * 2. Batch-fetch all contracts in a single query
 * 3. Batch-fetch all customers from those contracts
 * 4. Return products enriched with contract and customer data
 *
 * NOTE: The utility does NOT exist yet. All tests should be RED.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

describe("DB-001: Product data loader utility", () => {
  const utilPath = resolve(__dirname, "productDataLoader.ts");

  it("should exist as a utility file", () => {
    expect(existsSync(utilPath)).toBe(true);
  });

  it("should export enrichProductsWithContracts function", () => {
    const source = readFileSync(utilPath, "utf-8");
    expect(source).toMatch(/export\s+(async\s+)?function\s+enrichProductsWithContracts/);
  });

  it("should use batch loading pattern (not individual getDoc per product)", () => {
    const source = readFileSync(utilPath, "utf-8");
    // Should collect unique IDs first, then batch fetch
    expect(source).toContain("Promise.all");
    // Should use Map for efficient lookups
    expect(source).toMatch(/new Map|Map</);
  });

  it("should handle both contracts and customers in batch", () => {
    const source = readFileSync(utilPath, "utf-8");
    expect(source).toContain("contracts");
    expect(source).toContain("customers");
  });

  it("should not have raw error objects in console.error", () => {
    const source = readFileSync(utilPath, "utf-8");
    const lines = source.split("\n");
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

  it("should use DocumentReference type from firebase/firestore", () => {
    const source = readFileSync(utilPath, "utf-8");
    expect(source).toContain("DocumentReference");
    expect(source).toMatch(/from\s+["']firebase\/firestore["']/);
  });

  it("should handle products without contract references gracefully", () => {
    const source = readFileSync(utilPath, "utf-8");
    // Should check if contract exists before processing
    expect(source).toMatch(/contract\s*&&|if\s*\(\s*contract|contract\s*\?\./);
  });
});
