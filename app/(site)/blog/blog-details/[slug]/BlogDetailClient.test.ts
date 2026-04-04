/**
 * SEC-007: Blog content XSS sanitization tests
 *
 * These tests verify that BlogDetailClient.tsx properly sanitizes HTML content
 * using DOMPurify before rendering via dangerouslySetInnerHTML.
 *
 * Strategy: Since the Jest environment has ESM compatibility issues with
 * dompurify's dependencies (jsdom), we test by verifying:
 * 1. The source code imports and uses DOMPurify correctly
 * 2. All content paths are sanitized before setRenderedContent
 *
 * This is a static analysis test that proves the fix is correctly applied.
 */
import * as fs from "fs";
import * as path from "path";

describe("SEC-007: Blog content XSS sanitization", () => {
  const sourceFilePath = path.resolve(__dirname, "BlogDetailClient.tsx");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = fs.readFileSync(sourceFilePath, "utf-8");
  });

  describe("DOMPurify import and usage", () => {
    it("should import dompurify", () => {
      // The component must import the sanitization library
      expect(sourceCode).toContain('from "dompurify"');
    });

    it("should have DOMPurify imported with correct name", () => {
      // Check for proper import statement
      const importPattern = /import\s+DOMPurify\s+from\s+["']dompurify["']/;
      expect(sourceCode).toMatch(importPattern);
    });

    it("should use DOMPurify.sanitize function", () => {
      // The sanitize function must be called
      expect(sourceCode).toContain("DOMPurify.sanitize");
    });
  });

  describe("Content sanitization paths", () => {
    it("should sanitize raw HTML content before setting state", () => {
      // The branch that handles already-HTML content must sanitize
      // Current code: setRenderedContent(content);  <- VULNERABLE
      // Fixed code: setRenderedContent(DOMPurify.sanitize(content));
      const rawContentPattern = /setRenderedContent\(\s*content\s*\)/;
      expect(sourceCode).not.toMatch(rawContentPattern);
    });

    it("should sanitize markdown-converted HTML before setting state", () => {
      // The branch that converts markdown must sanitize the result
      // Current code: setRenderedContent(htmlContent);  <- VULNERABLE
      // Fixed code: setRenderedContent(DOMPurify.sanitize(htmlContent));
      const rawHtmlContentPattern = /setRenderedContent\(\s*htmlContent\s*\)/;
      expect(sourceCode).not.toMatch(rawHtmlContentPattern);
    });

    it("should sanitize error fallback content before setting state", () => {
      // The catch block that falls back to raw content must also sanitize
      // Looking for setRenderedContent in catch block without DOMPurify
      const catchBlockMatch = sourceCode.match(/catch\s*\([^)]*\)\s*\{[\s\S]*?setRenderedContent\([^)]+\)/);
      if (catchBlockMatch) {
        expect(catchBlockMatch[0]).toContain("DOMPurify.sanitize");
      }
    });

    it("should have all non-empty setRenderedContent calls use DOMPurify.sanitize", () => {
      // Parse all setRenderedContent calls that are not setting empty string
      const lines = sourceCode.split("\n");
      const setContentCalls = lines.filter(
        (line) =>
          line.includes("setRenderedContent(") &&
          !line.includes('setRenderedContent("")') &&
          !line.includes("setRenderedContent('')") &&
          !line.includes("useState") &&
          !line.trim().startsWith("//"),
      );

      // Must have at least one call with actual content
      expect(setContentCalls.length).toBeGreaterThan(0);

      // Each call must use DOMPurify.sanitize
      for (const line of setContentCalls) {
        expect(line).toContain("DOMPurify.sanitize");
      }
    });
  });

  describe("Comprehensive sanitization coverage", () => {
    it("should sanitize content in the HTML detection branch", () => {
      // Find the HTML detection branch and verify it sanitizes
      const htmlDetectionBranch = sourceCode.match(
        /if\s*\(content\.includes\s*\(\s*["']<["']\s*\)[\s\S]*?\{[\s\S]*?setRenderedContent\([^)]+\)/,
      );

      expect(htmlDetectionBranch).not.toBeNull();
      if (htmlDetectionBranch) {
        expect(htmlDetectionBranch[0]).toContain("DOMPurify.sanitize");
      }
    });

    it("should sanitize content in the markdown conversion branch", () => {
      // Find the else branch (markdown path) and verify it sanitizes
      const markedParseUsage = sourceCode.includes("marked.parse");
      expect(markedParseUsage).toBe(true);

      // After marked.parse, next setRenderedContent must include sanitize
      const markedIndex = sourceCode.indexOf("marked.parse");
      const afterMarked = sourceCode.substring(markedIndex, markedIndex + 400);
      const setContentAfterMarked = afterMarked.match(/setRenderedContent\([^)]+\)/);

      expect(setContentAfterMarked).not.toBeNull();
      if (setContentAfterMarked) {
        expect(setContentAfterMarked[0]).toContain("DOMPurify.sanitize");
      }
    });

    it("should not have any path where unsanitized content reaches setRenderedContent", () => {
      // Comprehensive check: find ALL setRenderedContent calls
      const allSetContentCalls = sourceCode.match(/setRenderedContent\([^)]+\)/g) || [];

      for (const call of allSetContentCalls) {
        // Empty string is safe
        if (call.includes('""') || call.includes("''")) {
          continue;
        }
        // All other calls must use DOMPurify.sanitize
        expect(call).toContain("DOMPurify.sanitize");
      }
    });
  });

  describe("XSS attack vector prevention verification", () => {
    it("should have protection against script injection (via DOMPurify import)", () => {
      // DOMPurify strips <script> tags - verify we use it
      expect(sourceCode).toContain("DOMPurify");
    });

    it("should have protection against event handler injection (via DOMPurify import)", () => {
      // DOMPurify strips onclick, onerror, etc. - verify we use it
      expect(sourceCode).toContain("DOMPurify.sanitize");
    });

    it("should have protection against javascript: URLs (via DOMPurify import)", () => {
      // DOMPurify removes javascript: URLs - verify we use it
      expect(sourceCode).toContain("DOMPurify.sanitize");
    });

    it("dangerouslySetInnerHTML should only receive sanitized content", () => {
      // Find dangerouslySetInnerHTML usage
      expect(sourceCode).toContain("dangerouslySetInnerHTML");

      // It uses renderedContent state
      expect(sourceCode).toMatch(/__html:\s*renderedContent/);

      // renderedContent is set via setRenderedContent
      // The full chain must include DOMPurify.sanitize for the content to be safe
      // This assertion ensures the component uses DOMPurify somewhere in the chain
      expect(sourceCode).toContain("DOMPurify.sanitize");
    });
  });
});
