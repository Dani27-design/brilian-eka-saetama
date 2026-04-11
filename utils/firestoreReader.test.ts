import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

describe("ARCH-012: Server action moved to utils", () => {
  it("should have firestoreReader.ts in utils", () => {
    expect(existsSync(resolve(__dirname, "firestoreReader.ts"))).toBe(true);
  });

  it("should NOT have actions/read/hero.ts", () => {
    expect(existsSync(resolve(__dirname, "../actions/read/hero.ts"))).toBe(false);
  });

  it("should NOT have actions directory at all", () => {
    expect(existsSync(resolve(__dirname, "../actions"))).toBe(false);
  });

  it("should export getData function", () => {
    const source = readFileSync(resolve(__dirname, "firestoreReader.ts"), "utf-8");
    expect(source).toContain("export");
    expect(source).toContain("getData");
  });

  it("should not have raw error objects in console.error", () => {
    const source = readFileSync(resolve(__dirname, "firestoreReader.ts"), "utf-8");
    const lines = source.split("\n");
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

  it("opengraph-image should import from firestoreReader", () => {
    const ogPath = resolve(__dirname, "../app/(site)/blog/blog-details/[slug]/opengraph-image.tsx");
    if (existsSync(ogPath)) {
      const source = readFileSync(ogPath, "utf-8");
      expect(source).toContain("firestoreReader");
      expect(source).not.toContain("actions/read/hero");
    }
  });

  it("server-sitemap should import from firestoreReader", () => {
    const sitemapPath = resolve(__dirname, "../app/server-sitemap-index.xml/route.ts");
    if (existsSync(sitemapPath)) {
      const source = readFileSync(sitemapPath, "utf-8");
      expect(source).toContain("firestoreReader");
      expect(source).not.toContain("actions/read/hero");
    }
  });
});
