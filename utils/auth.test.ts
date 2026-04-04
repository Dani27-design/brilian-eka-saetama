/**
 * Tests for shared auth utility: verifyAdminAuth
 *
 * This file tests the extracted authentication utility that will be used
 * across all API routes requiring admin authentication.
 *
 * NOTE: The utility does NOT exist yet. All tests should be RED.
 */

import { NextRequest } from "next/server";

// Mock firebase-admin/auth before importing the module under test
jest.mock("firebase-admin/auth", () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

// Mock the admin firestore
jest.mock("@/db/firebase/firebaseAdmin", () => ({
  adminFirestore: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
      })),
    })),
  },
}));

import { getAuth } from "firebase-admin/auth";
import { adminFirestore } from "@/db/firebase/firebaseAdmin";

// Import the utility under test (does not exist yet - will cause RED)
import { verifyAdminAuth } from "@/utils/auth";

describe("verifyAdminAuth — shared authentication utility", () => {
  const mockVerifyIdToken = jest.fn();
  const mockGet = jest.fn();
  const mockDoc = jest.fn(() => ({ get: mockGet }));
  const mockCollection = jest.fn(() => ({ doc: mockDoc }));

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock chain
    (getAuth as jest.Mock).mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    });
    (adminFirestore.collection as jest.Mock).mockImplementation(mockCollection);
    mockCollection.mockReturnValue({ doc: mockDoc });
    mockDoc.mockReturnValue({ get: mockGet });
  });

  describe("success cases", () => {
    it("should return null when valid admin token is provided", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: { Authorization: "Bearer valid-admin-token" },
      });

      mockVerifyIdToken.mockResolvedValue({ uid: "admin-user-123" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: "admin", name: "Admin User" }),
      });

      // Act
      const result = await verifyAdminAuth(req);

      // Assert
      expect(result).toBeNull();
      expect(mockVerifyIdToken).toHaveBeenCalledWith("valid-admin-token");
      expect(mockCollection).toHaveBeenCalledWith("users");
      expect(mockDoc).toHaveBeenCalledWith("admin-user-123");
    });
  });

  describe("error cases", () => {
    it("should return 401 when no Authorization header is provided", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/test");

      // Act
      const result = await verifyAdminAuth(req);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.status).toBe(401);
      const body = await result!.json();
      expect(body).toEqual({ error: "Authentication required" });
    });

    it("should return 401 when Authorization header does not start with Bearer", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: { Authorization: "Basic some-credentials" },
      });

      // Act
      const result = await verifyAdminAuth(req);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.status).toBe(401);
      const body = await result!.json();
      expect(body).toEqual({ error: "Authentication required" });
    });

    it("should return 401 when Authorization header has empty Bearer token", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: { Authorization: "Bearer " },
      });

      mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));

      // Act
      const result = await verifyAdminAuth(req);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.status).toBe(401);
    });

    it("should return 401 when token is invalid or expired", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: { Authorization: "Bearer invalid-or-expired-token" },
      });

      mockVerifyIdToken.mockRejectedValue(new Error("Token expired"));

      // Act
      const result = await verifyAdminAuth(req);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.status).toBe(401);
      const body = await result!.json();
      expect(body.error).toMatch(/Token expired|Authentication failed/);
    });

    it("should return 404 when user does not exist in Firestore", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: { Authorization: "Bearer valid-token-unknown-user" },
      });

      mockVerifyIdToken.mockResolvedValue({ uid: "unknown-user-456" });
      mockGet.mockResolvedValue({
        exists: false,
        data: () => undefined,
      });

      // Act
      const result = await verifyAdminAuth(req);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.status).toBe(404);
      const body = await result!.json();
      expect(body).toEqual({ error: "User not found" });
    });

    it("should return 403 when user has engineer role", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: { Authorization: "Bearer valid-token-engineer" },
      });

      mockVerifyIdToken.mockResolvedValue({ uid: "engineer-user-789" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: "engineer", name: "Engineer User" }),
      });

      // Act
      const result = await verifyAdminAuth(req);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
      const body = await result!.json();
      expect(body).toEqual({ error: "Admin access required" });
    });

    it("should return 403 when user has user role", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: { Authorization: "Bearer valid-token-regular-user" },
      });

      mockVerifyIdToken.mockResolvedValue({ uid: "regular-user-101" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: "user", name: "Regular User" }),
      });

      // Act
      const result = await verifyAdminAuth(req);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
      const body = await result!.json();
      expect(body).toEqual({ error: "Admin access required" });
    });

    it("should return 403 when user has client role", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: { Authorization: "Bearer valid-token-client" },
      });

      mockVerifyIdToken.mockResolvedValue({ uid: "client-user-202" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: "client", name: "Client User" }),
      });

      // Act
      const result = await verifyAdminAuth(req);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
      const body = await result!.json();
      expect(body).toEqual({ error: "Admin access required" });
    });
  });

  describe("edge cases", () => {
    it("should return 403 when user has no role field", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: { Authorization: "Bearer valid-token-no-role" },
      });

      mockVerifyIdToken.mockResolvedValue({ uid: "user-no-role-303" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ name: "User Without Role" }),
      });

      // Act
      const result = await verifyAdminAuth(req);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
      const body = await result!.json();
      expect(body).toEqual({ error: "Admin access required" });
    });

    it("should return 403 when user role is undefined", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: { Authorization: "Bearer valid-token-undefined-role" },
      });

      mockVerifyIdToken.mockResolvedValue({ uid: "user-undefined-role-404" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: undefined, name: "User With Undefined Role" }),
      });

      // Act
      const result = await verifyAdminAuth(req);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
      const body = await result!.json();
      expect(body).toEqual({ error: "Admin access required" });
    });

    it("should return 403 when user role is null", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: { Authorization: "Bearer valid-token-null-role" },
      });

      mockVerifyIdToken.mockResolvedValue({ uid: "user-null-role-505" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: null, name: "User With Null Role" }),
      });

      // Act
      const result = await verifyAdminAuth(req);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
      const body = await result!.json();
      expect(body).toEqual({ error: "Admin access required" });
    });

    it("should return 403 when user role is empty string", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: { Authorization: "Bearer valid-token-empty-role" },
      });

      mockVerifyIdToken.mockResolvedValue({ uid: "user-empty-role-606" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: "", name: "User With Empty Role" }),
      });

      // Act
      const result = await verifyAdminAuth(req);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
      const body = await result!.json();
      expect(body).toEqual({ error: "Admin access required" });
    });

    it("should be case-sensitive for admin role check", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: { Authorization: "Bearer valid-token-Admin-case" },
      });

      mockVerifyIdToken.mockResolvedValue({ uid: "user-Admin-case-707" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: "Admin", name: "User With Admin (capitalized)" }),
      });

      // Act
      const result = await verifyAdminAuth(req);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
      const body = await result!.json();
      expect(body).toEqual({ error: "Admin access required" });
    });
  });
});
