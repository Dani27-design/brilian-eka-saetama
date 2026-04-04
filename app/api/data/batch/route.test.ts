import { existsSync } from "fs";
import { resolve } from "path";

/**
 * SEC-004: Batch Data API Route Removal Verification
 *
 * This test suite verifies that the unauthenticated batch write endpoint
 * has been completely removed from the codebase.
 *
 * Security issue: The batch API route allowed unauthenticated writes to
 * any Firestore collection, enabling attackers to create, update, or
 * overwrite arbitrary documents without authentication.
 *
 * Fix: Complete removal of the endpoint and its supporting action.
 */
describe("SEC-004: Batch data API route removed", () => {
  describe("API route file removal", () => {
    it("should not have the batch API route file", () => {
      const routePath = resolve(__dirname, "route.ts");
      expect(existsSync(routePath)).toBe(false);
    });
  });

  describe("Action file removal", () => {
    it("should not have the batchCreateData action file", () => {
      const actionPath = resolve(
        __dirname,
        "../../../../actions/create/index.ts"
      );
      expect(existsSync(actionPath)).toBe(false);
    });
  });
});
