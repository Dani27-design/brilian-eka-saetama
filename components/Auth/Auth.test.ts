import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

describe("BUG-002: Non-functional public auth pages removed", () => {
  describe("Auth components should not exist", () => {
    it("should not have Signin component", () => {
      expect(existsSync(resolve(__dirname, "Signin.tsx"))).toBe(false);
    });

    it("should not have Signup component", () => {
      expect(existsSync(resolve(__dirname, "Signup.tsx"))).toBe(false);
    });
  });

  describe("Auth pages should not exist", () => {
    it("should not have signin page", () => {
      const pagePath = resolve(__dirname, "../../app/(site)/auth/signin/page.tsx");
      expect(existsSync(pagePath)).toBe(false);
    });

    it("should not have signup page", () => {
      const pagePath = resolve(__dirname, "../../app/(site)/auth/signup/page.tsx");
      expect(existsSync(pagePath)).toBe(false);
    });
  });

  describe("Unused CTA component should not exist", () => {
    it("should not have CTA component", () => {
      const ctaPath = resolve(__dirname, "../CTA/index.tsx");
      expect(existsSync(ctaPath)).toBe(false);
    });
  });

  describe("No remaining references to deleted auth pages", () => {
    it("ErrorGeneric should not reference /auth/signin", () => {
      const errorGenericPath = resolve(__dirname, "../ErrorPages/ErrorGeneric.tsx");
      if (existsSync(errorGenericPath)) {
        const source = readFileSync(errorGenericPath, "utf-8");
        expect(source).not.toContain("/auth/signin");
        expect(source).not.toContain("/auth/signup");
      }
    });
  });

  describe("Admin login should still exist", () => {
    it("should still have admin login page", () => {
      const adminLoginPath = resolve(__dirname, "../../app/(admin)/admin/login/page.tsx");
      expect(existsSync(adminLoginPath)).toBe(true);
    });
  });
});
