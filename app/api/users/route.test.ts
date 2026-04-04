/**
 * Unit tests for POST /api/users endpoint
 * Tests authentication and authorization for user creation
 */

// Create mock implementations that will be referenced inside mock factories
const mockVerifyIdToken = jest.fn();
const mockCreateUser = jest.fn();
const mockGet = jest.fn();
const mockSet = jest.fn();

// Mock firebase-admin/auth - use arrow function returning object with our mocks
jest.mock("firebase-admin/auth", () => {
  return {
    getAuth: () => ({
      verifyIdToken: mockVerifyIdToken,
      createUser: mockCreateUser,
    }),
  };
});

// Mock Firestore - use arrow functions to create the chain dynamically
jest.mock("../../../db/firebase/firebaseAdmin", () => {
  return {
    adminFirestore: {
      collection: () => ({
        doc: () => ({
          get: mockGet,
          set: mockSet,
        }),
      }),
    },
  };
});

import { NextRequest } from "next/server";
import { POST } from "./route";

describe("POST /api/users — user creation endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createRequest(body: object, authHeader?: string): NextRequest {
    const headers = new Headers();
    if (authHeader !== undefined) {
      headers.set("Authorization", authHeader);
    }

    return new NextRequest("http://localhost:3000/api/users", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  }

  const validUserPayload = {
    email: "newuser@example.com",
    password: "securePassword123",
    name: "New User",
    role: "engineer",
  };

  describe("authentication error cases", () => {
    it("should return 401 when Authorization header is missing", async () => {
      const request = createRequest(validUserPayload);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 401 when Authorization header has no Bearer prefix", async () => {
      const request = createRequest(
        validUserPayload,
        "some-token-without-bearer"
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 401 when Authorization header is empty Bearer", async () => {
      // Note: Headers API trims trailing whitespace, so "Bearer " becomes "Bearer"
      // This fails startsWith("Bearer ") check, returning "Authentication required"
      const request = createRequest(validUserPayload, "Bearer ");

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 401 when token is invalid", async () => {
      const request = createRequest(validUserPayload, "Bearer invalid-token");

      mockVerifyIdToken.mockRejectedValue(
        new Error("Decoding Firebase ID token failed")
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Decoding Firebase ID token failed");
    });

    it("should return 401 when token is expired", async () => {
      const request = createRequest(validUserPayload, "Bearer expired-token");

      mockVerifyIdToken.mockRejectedValue(
        new Error("Firebase ID token has expired")
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Firebase ID token has expired");
    });
  });

  describe("authorization error cases", () => {
    it("should return 404 when caller user is not found in Firestore", async () => {
      const request = createRequest(validUserPayload, "Bearer valid-token");

      mockVerifyIdToken.mockResolvedValue({ uid: "caller-uid-123" });
      mockGet.mockResolvedValue({ exists: false });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });

    it("should return 403 when caller has role engineer", async () => {
      const request = createRequest(validUserPayload, "Bearer valid-token");

      mockVerifyIdToken.mockResolvedValue({ uid: "engineer-uid" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: "engineer", name: "Engineer User" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Admin access required");
    });

    it("should return 403 when caller has role user", async () => {
      const request = createRequest(validUserPayload, "Bearer valid-token");

      mockVerifyIdToken.mockResolvedValue({ uid: "user-uid" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: "user", name: "Regular User" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Admin access required");
    });

    it("should return 403 when caller has role client", async () => {
      const request = createRequest(validUserPayload, "Bearer valid-token");

      mockVerifyIdToken.mockResolvedValue({ uid: "client-uid" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: "client", name: "Client User" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Admin access required");
    });

    it("should return 403 when caller has no role defined", async () => {
      const request = createRequest(validUserPayload, "Bearer valid-token");

      mockVerifyIdToken.mockResolvedValue({ uid: "no-role-uid" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ name: "User Without Role" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Admin access required");
    });
  });

  describe("success cases", () => {
    it("should return 200 and create user when caller is admin", async () => {
      const request = createRequest(
        validUserPayload,
        "Bearer valid-admin-token"
      );

      mockVerifyIdToken.mockResolvedValue({ uid: "admin-uid" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: "admin", name: "Admin User" }),
      });
      mockCreateUser.mockResolvedValue({ uid: "new-user-uid" });
      mockSet.mockResolvedValue(undefined);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.userId).toBe("new-user-uid");

      expect(mockCreateUser).toHaveBeenCalledWith({
        email: validUserPayload.email,
        password: validUserPayload.password,
        displayName: validUserPayload.name,
      });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          email: validUserPayload.email,
          name: validUserPayload.name,
          role: validUserPayload.role,
          isActive: true,
        })
      );
    });
  });

  describe("edge cases", () => {
    it("should return 401 when Authorization header is just Bearer with extra spaces", async () => {
      const request = createRequest(validUserPayload, "Bearer    ");

      mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it("should return 401 when Authorization header uses lowercase bearer", async () => {
      const request = createRequest(validUserPayload, "bearer valid-token");

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 401 when Authorization header uses Basic instead of Bearer", async () => {
      const request = createRequest(validUserPayload, "Basic dXNlcjpwYXNz");

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });
  });
});
