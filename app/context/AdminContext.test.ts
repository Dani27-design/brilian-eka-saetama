import { readFileSync } from "fs";
import { resolve } from "path";

describe("BUG-001: SignOut must call Firebase auth.signOut()", () => {
  const sourceFilePath = resolve(__dirname, "AdminContext.tsx");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  describe("Firebase signOut import", () => {
    it("should import signOut from firebase/auth", () => {
      // Must have signOut in the firebase/auth import
      expect(sourceCode).toMatch(
        /import\s*\{[^}]*signOut[^}]*\}\s*from\s*["']firebase\/auth["']/
      );
    });
  });

  describe("handleSignOut implementation", () => {
    it("should NOT just return Promise.resolve()", () => {
      // The buggy code had: return Promise.resolve()
      // This must be removed
      const handleSignOutBlock = sourceCode.match(
        /handleSignOut\s*=\s*async\s*\(\)\s*=>\s*\{[\s\S]*?\n\s*\};/
      );
      expect(handleSignOutBlock).not.toBeNull();
      if (handleSignOutBlock) {
        expect(handleSignOutBlock[0]).not.toContain("Promise.resolve()");
      }
    });

    it("should call signOut or auth.signOut()", () => {
      // The fix must call Firebase signOut
      const handleSignOutBlock = sourceCode.match(
        /handleSignOut\s*=\s*async\s*\(\)\s*=>\s*\{[\s\S]*?\n\s*\};/
      );
      expect(handleSignOutBlock).not.toBeNull();
      if (handleSignOutBlock) {
        const hasSignOut =
          handleSignOutBlock[0].includes("signOut(auth)") ||
          handleSignOutBlock[0].includes("auth.signOut()");
        expect(hasSignOut).toBe(true);
      }
    });

    it("should await the signOut call", () => {
      // signOut must be awaited, not fire-and-forget
      const handleSignOutBlock = sourceCode.match(
        /handleSignOut\s*=\s*async\s*\(\)\s*=>\s*\{[\s\S]*?\n\s*\};/
      );
      expect(handleSignOutBlock).not.toBeNull();
      if (handleSignOutBlock) {
        const hasAwaitSignOut =
          handleSignOutBlock[0].includes("await signOut(auth)") ||
          handleSignOutBlock[0].includes("await auth.signOut()");
        expect(hasAwaitSignOut).toBe(true);
      }
    });
  });

  describe("Error logging sanitization", () => {
    it("should not log raw error objects in console.error", () => {
      // Per SEC-014: no console.error("msg:", error) with raw error
      const lines = sourceCode.split("\n");
      for (const line of lines) {
        if (line.trim().startsWith("//")) continue;
        if (line.includes("console.error(")) {
          // Should not end with a bare error variable
          const badPattern = /console\.error\([^)]*,\s*(error|err)\s*\)/;
          if (badPattern.test(line)) {
            throw new Error(
              `Found raw error object in console.error: ${line.trim()}`
            );
          }
        }
      }
    });
  });
});
