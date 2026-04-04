import { readFileSync } from "fs";
import { resolve } from "path";

describe("BUG-008: Contract creation cleanup and race condition mitigation", () => {
  const sourceFilePath = resolve(__dirname, "page.tsx");
  let sourceCode: string;

  beforeAll(() => {
    sourceCode = readFileSync(sourceFilePath, "utf-8");
  });

  describe("No debug console.log statements", () => {
    it("should not have any console.log in the file", () => {
      const lines = sourceCode.split("\n");
      const logLines = lines.filter(
        (line) =>
          line.includes("console.log(") &&
          !line.trim().startsWith("//")
      );
      expect(logLines).toEqual([]);
    });
  });

  describe("No redundant validation", () => {
    it("should not have duplicate required field checks after uniqueness query", () => {
      // The old code had a second validation block checking contractNumber/customer/startDate/endDate
      // AFTER the uniqueness query (getDocs) in handleSubmit. This was redundant since the same
      // fields are checked at the start of handleSubmit. Look for the pattern of checking these
      // fields between getDocs and the snapshot.empty check within handleSubmit.

      // Find handleSubmit function first to scope our search correctly
      const handleSubmitIndex = sourceCode.indexOf("const handleSubmit = async");
      expect(handleSubmitIndex).toBeGreaterThan(-1);

      const handleSubmitCode = sourceCode.substring(handleSubmitIndex);

      // Find getDocs within handleSubmit
      const getDocsQueryIndex = handleSubmitCode.indexOf("const snapshot = await getDocs(q)");
      expect(getDocsQueryIndex).toBeGreaterThan(-1);

      // Find snapshot.empty within handleSubmit
      const snapshotEmptyIndex = handleSubmitCode.indexOf("snapshot.empty");
      expect(snapshotEmptyIndex).toBeGreaterThan(-1);

      // Get the code between getDocs and snapshot.empty check within handleSubmit
      const betweenQueryAndCheck = handleSubmitCode.substring(getDocsQueryIndex, snapshotEmptyIndex);

      // Should NOT have a validation block between the query and the snapshot check
      // This pattern matches: if (!form.contractNumber || !form.customer ...)
      expect(betweenQueryAndCheck).not.toMatch(/if\s*\(\s*[\s\S]*!form\.contractNumber[\s\S]*!form\.customer/);
    });
  });

  describe("Uniqueness check is close to addDoc", () => {
    it("should have the uniqueness query immediately before the try/addDoc block", () => {
      // The uniqueness check (snapshot) should be close to addDoc, not separated by
      // a large validation block. Find the distance between snapshot.empty and addDoc.
      const snapshotEmptyIndex = sourceCode.lastIndexOf("snapshot.empty");
      const addDocIndex = sourceCode.indexOf("addDoc(collection(firestore", snapshotEmptyIndex);

      expect(snapshotEmptyIndex).toBeGreaterThan(-1);
      expect(addDocIndex).toBeGreaterThan(-1);

      // The distance between the check and the write should be small (< 500 chars)
      // Previously it was separated by a redundant validation block
      const distance = addDocIndex - snapshotEmptyIndex;
      expect(distance).toBeLessThan(500);
    });
  });

  describe("Console.error sanitization", () => {
    it("should not have raw error objects in console.error", () => {
      const lines = sourceCode.split("\n");
      for (const line of lines) {
        if (line.trim().startsWith("//")) continue;
        if (line.includes("console.error(")) {
          const badPattern = /console\.error\([^)]*,\s*(error|err|maintenanceError)\s*\)/;
          if (badPattern.test(line)) {
            throw new Error(`Found raw error object in console.error: ${line.trim()}`);
          }
        }
      }
    });
  });
});
