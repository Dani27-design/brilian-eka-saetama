import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

describe("BUG-003: AuthGuard removed (unused, conflicting role logic)", () => {
  it("should not have AuthGuard.tsx component", () => {
    expect(existsSync(resolve(__dirname, "AuthGuard.tsx"))).toBe(false);
  });

  it("should not reference AuthGuard in login page comment", () => {
    const loginPath = resolve(
      __dirname,
      "../../app/(admin)/admin/login/page.tsx"
    );
    if (existsSync(loginPath)) {
      const source = readFileSync(loginPath, "utf-8");
      expect(source).not.toContain("AuthGuard");
    }
  });

  it("should still have AdminLayoutClient.tsx (the active auth component)", () => {
    expect(existsSync(resolve(__dirname, "AdminLayoutClient.tsx"))).toBe(true);
  });

  it("login page should not have raw error objects in console.error", () => {
    const loginPath = resolve(
      __dirname,
      "../../app/(admin)/admin/login/page.tsx"
    );
    if (existsSync(loginPath)) {
      const source = readFileSync(loginPath, "utf-8");
      const lines = source.split("\n");
      for (const line of lines) {
        if (line.trim().startsWith("//")) continue;
        if (line.includes("console.error(")) {
          const badPattern = /console\.error\([^)]*,\s*(error|err)\s*\)/;
          if (badPattern.test(line)) {
            throw new Error(
              `Found raw error object in console.error: ${line.trim()}`
            );
          }
        }
      }
    }
  });
});
