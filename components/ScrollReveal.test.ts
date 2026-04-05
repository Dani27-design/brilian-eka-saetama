import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

describe("PERF-004: ScrollReveal component", () => {
  const componentPath = resolve(__dirname, "ScrollReveal.tsx");

  it("should exist", () => {
    expect(existsSync(componentPath)).toBe(true);
  });

  it("should use IntersectionObserver", () => {
    const source = readFileSync(componentPath, "utf-8");
    expect(source).toContain("IntersectionObserver");
  });

  it("should be a client component", () => {
    const source = readFileSync(componentPath, "utf-8");
    expect(source).toContain('"use client"');
  });

  it("should NOT import framer-motion", () => {
    const source = readFileSync(componentPath, "utf-8");
    expect(source).not.toContain("framer-motion");
  });
});
