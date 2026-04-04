/**
 * Tests for analytics devices API route: GET /api/analytics/devices
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
  getDevicesData: jest.fn(),
}));

import { verifyAdminAuth } from "@/utils/auth";
import { getDevicesData } from "@/services/analyticsService";
import { GET } from "./route";
import { NextResponse } from "next/server";

describe("GET /api/analytics/devices — device analytics endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("authentication", () => {
    it("should return 401 when no Authorization header is provided", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/analytics/devices");

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
      const req = new NextRequest("http://localhost:3000/api/analytics/devices", {
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
    it("should return 200 with devices data when admin is authenticated", async () => {
      // Arrange
      const req = new NextRequest(
        "http://localhost:3000/api/analytics/devices?startDate=7daysAgo&endDate=today",
        {
          headers: { Authorization: "Bearer valid-admin-token" },
        }
      );

      const mockDevicesData = {
        devices: [
          { device: "desktop", visitors: 600, percentage: 60 },
          { device: "mobile", visitors: 350, percentage: 35 },
          { device: "tablet", visitors: 50, percentage: 5 },
        ],
      };

      // Mock verifyAdminAuth to return null (success)
      (verifyAdminAuth as jest.Mock).mockResolvedValue(null);
      (getDevicesData as jest.Mock).mockResolvedValue(mockDevicesData);

      // Act
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockDevicesData);
      expect(getDevicesData).toHaveBeenCalledWith("7daysAgo", "today");
    });

    it("should use default date range when not provided", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/analytics/devices", {
        headers: { Authorization: "Bearer valid-admin-token" },
      });

      const mockDevicesData = {
        devices: [],
      };

      (verifyAdminAuth as jest.Mock).mockResolvedValue(null);
      (getDevicesData as jest.Mock).mockResolvedValue(mockDevicesData);

      // Act
      const response = await GET(req);

      // Assert
      expect(response.status).toBe(200);
      expect(getDevicesData).toHaveBeenCalledWith("30daysAgo", "today");
    });
  });

  describe("error cases", () => {
    it("should return 500 when devices service throws an exception", async () => {
      // Arrange
      const req = new NextRequest("http://localhost:3000/api/analytics/devices", {
        headers: { Authorization: "Bearer valid-admin-token" },
      });

      (verifyAdminAuth as jest.Mock).mockResolvedValue(null);
      (getDevicesData as jest.Mock).mockRejectedValue(
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
