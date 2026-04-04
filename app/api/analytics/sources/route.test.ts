/**
 * Tests for analytics sources API route: GET /api/analytics/sources
 *
 * This route currently has NO authentication.
 * After SEC-005 implementation, it should require admin auth.
 *
 * NOTE: Auth tests should be RED until authentication is implemented.
 */

import { NextRequest } from "next/server";

// Mock the auth utility (will be created)
jest.mock("@/utils/auth", () => ({
  verifyAdminAuth: jest.fn(),
}));

// Mock firebase-admin/auth
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

// Mock the analytics service
jest.mock("@/services/analyticsService", () => ({
  getSourcesData: jest.fn(),
}));

import { verifyAdminAuth } from "@/utils/auth";
import { getSourcesData } from "@/services/analyticsService";
import { GET } from "./route";
import { NextResponse } from "next/server";

describe("GET /api/analytics/sources — traffic sources endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("authentication", () => {
    it("should return 401 when no Authorization header is provided", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/analytics/sources");

      // Mock verifyAdminAuth to return 401 response
      (verifyAdminAuth as jest.Mock).mockResolvedValue(
        NextResponse.json({ error: "Authentication required" }, { status: 401 })
      );

      // Act
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: "Authentication required" });
    });

    it("should return 403 when user is not an admin", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/analytics/sources", {
        headers: { Authorization: "Bearer valid-token-non-admin" },
      });

      // Mock verifyAdminAuth to return 403 response
      (verifyAdminAuth as jest.Mock).mockResolvedValue(
        NextResponse.json({ error: "Admin access required" }, { status: 403 })
      );

      // Act
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({ error: "Admin access required" });
    });
  });

  describe("success cases", () => {
    it("should return 200 with sources data when admin is authenticated", async () => {
      // Arrange
      const req = new NextRequest(
        "http://localhost:3000/api/analytics/sources?startDate=7daysAgo&endDate=today",
        {
          headers: { Authorization: "Bearer valid-admin-token" },
        }
      );

      const mockSourcesData = {
        sources: [
          { source: "google", visitors: 500, percentage: 50 },
          { source: "direct", visitors: 300, percentage: 30 },
          { source: "facebook", visitors: 200, percentage: 20 },
        ],
      };

      // Mock verifyAdminAuth to return null (success)
      (verifyAdminAuth as jest.Mock).mockResolvedValue(null);
      (getSourcesData as jest.Mock).mockResolvedValue(mockSourcesData);

      // Act
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockSourcesData);
      expect(getSourcesData).toHaveBeenCalledWith("7daysAgo", "today");
    });

    it("should use default date range when not provided", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/analytics/sources", {
        headers: { Authorization: "Bearer valid-admin-token" },
      });

      const mockSourcesData = {
        sources: [],
      };

      (verifyAdminAuth as jest.Mock).mockResolvedValue(null);
      (getSourcesData as jest.Mock).mockResolvedValue(mockSourcesData);

      // Act
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      expect(getSourcesData).toHaveBeenCalledWith("30daysAgo", "today");
    });
  });

  describe("error cases", () => {
    it("should return 500 when sources service throws an exception", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/analytics/sources", {
        headers: { Authorization: "Bearer valid-admin-token" },
      });

      (verifyAdminAuth as jest.Mock).mockResolvedValue(null);
      (getSourcesData as jest.Mock).mockRejectedValue(
        new Error("Google Analytics API error")
      );

      // Act
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({ error: "Internal server error" });
    });
  });
});
