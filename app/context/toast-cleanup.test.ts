import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

describe("ARCH-011: ToastContext removed, Toaster inlined", () => {
  it("should not have ToastContext.tsx file", () => {
    expect(existsSync(resolve(__dirname, "ToastContext.tsx"))).toBe(false);
  });

  it("should have Toaster imported directly in ClientLayoutWrapper", () => {
    const wrapperPath = resolve(__dirname, "../(site)/ClientLayoutWrapper.tsx");
    const source = readFileSync(wrapperPath, "utf-8");
    expect(source).toContain('from "react-hot-toast"');
    expect(source).toContain("Toaster");
  });

  it("should not reference ToasterContext or ToastContext in ClientLayoutWrapper", () => {
    const wrapperPath = resolve(__dirname, "../(site)/ClientLayoutWrapper.tsx");
    const source = readFileSync(wrapperPath, "utf-8");
    expect(source).not.toContain("ToasterContext");
    expect(source).not.toContain("ToastContext");
  });
});
