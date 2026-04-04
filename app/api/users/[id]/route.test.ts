/**
 * Unit tests for PUT and GET /api/users/[id] endpoints
 * Tests authentication and authorization for user updates and reads
 */

// Create mock implementations that will be referenced inside mock factories
const mockVerifyIdToken = jest.fn();
const mockUpdateUser = jest.fn();
const mockGet = jest.fn();
const mockUpdate = jest.fn();

// Mock firebase-admin/auth - use arrow function returning object with our mocks
jest.mock("firebase-admin/auth", () => {
  return {
    getAuth: () => ({
      verifyIdToken: mockVerifyIdToken,
      updateUser: mockUpdateUser,
    }),
  };
});

// Mock Firestore - use arrow functions to create the chain dynamically
jest.mock("../../../../db/firebase/firebaseAdmin", () => {
  return {
    adminFirestore: {
      collection: () => ({
        doc: () => ({
          get: mockGet,
          update: mockUpdate,
        }),
      }),
    },
  };
});

import { NextRequest } from "next/server";
import { PUT, GET } from "./route";

describe("PUT /api/users/[id] — user update endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createRequest(body: object, authHeader?: string): NextRequest {
    const headers = new Headers();
    if (authHeader !== undefined) {
      headers.set("Authorization", authHeader);
    }

    return new NextRequest("http://localhost:3000/api/users/target-user-id", {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
  }

  const validUpdatePayload = {
    name: "Updated Name",
    email: "updated@example.com",
    role: "engineer",
    isActive: true,
  };

  const routeParams = { params: { id: "target-user-id" } };

  describe("authentication error cases", () => {
    it("should return 401 when Authorization header is missing", async () => {
      const request = createRequest(validUpdatePayload);

      const response = await PUT(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 401 when Authorization header has no Bearer prefix", async () => {
      const request = createRequest(
        validUpdatePayload,
        "some-token-without-bearer"
      );

      const response = await PUT(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 401 when Authorization header is empty Bearer", async () => {
      // Note: Headers API trims trailing whitespace, so "Bearer " becomes "Bearer"
      // This fails startsWith("Bearer ") check, returning "Authentication required"
      const request = createRequest(validUpdatePayload, "Bearer ");

      const response = await PUT(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 401 when token is invalid", async () => {
      const request = createRequest(validUpdatePayload, "Bearer invalid-token");

      mockVerifyIdToken.mockRejectedValue(
        new Error("Decoding Firebase ID token failed")
      );

      const response = await PUT(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Decoding Firebase ID token failed");
    });

    it("should return 401 when token is expired", async () => {
      const request = createRequest(validUpdatePayload, "Bearer expired-token");

      mockVerifyIdToken.mockRejectedValue(
        new Error("Firebase ID token has expired")
      );

      const response = await PUT(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Firebase ID token has expired");
    });
  });

  describe("authorization error cases", () => {
    it("should return 404 when caller user is not found in Firestore", async () => {
      const request = createRequest(validUpdatePayload, "Bearer valid-token");

      mockVerifyIdToken.mockResolvedValue({ uid: "caller-uid-123" });
      mockGet.mockResolvedValue({ exists: false });

      const response = await PUT(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });

    it("should return 403 when caller has role engineer", async () => {
      const request = createRequest(validUpdatePayload, "Bearer valid-token");

      mockVerifyIdToken.mockResolvedValue({ uid: "engineer-uid" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: "engineer", name: "Engineer User" }),
      });

      const response = await PUT(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Admin access required");
    });

    it("should return 403 when caller has role user", async () => {
      const request = createRequest(validUpdatePayload, "Bearer valid-token");

      mockVerifyIdToken.mockResolvedValue({ uid: "user-uid" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: "user", name: "Regular User" }),
      });

      const response = await PUT(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Admin access required");
    });

    it("should return 403 when caller has role client", async () => {
      const request = createRequest(validUpdatePayload, "Bearer valid-token");

      mockVerifyIdToken.mockResolvedValue({ uid: "client-uid" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: "client", name: "Client User" }),
      });

      const response = await PUT(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Admin access required");
    });

    it("should return 403 when caller has no role defined", async () => {
      const request = createRequest(validUpdatePayload, "Bearer valid-token");

      mockVerifyIdToken.mockResolvedValue({ uid: "no-role-uid" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ name: "User Without Role" }),
      });

      const response = await PUT(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Admin access required");
    });
  });

  describe("success cases", () => {
    it("should return 200 and update user when caller is admin", async () => {
      const request = createRequest(
        validUpdatePayload,
        "Bearer valid-admin-token"
      );

      mockVerifyIdToken.mockResolvedValue({ uid: "admin-uid" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: "admin", name: "Admin User" }),
      });
      mockUpdateUser.mockResolvedValue({ uid: "target-user-id" });
      mockUpdate.mockResolvedValue(undefined);

      const response = await PUT(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("User updated successfully");

      expect(mockUpdateUser).toHaveBeenCalledWith(
        "target-user-id",
        expect.objectContaining({
          displayName: validUpdatePayload.name,
          email: validUpdatePayload.email,
        })
      );
    });
  });

  describe("edge cases", () => {
    it("should return 401 when Authorization header uses lowercase bearer", async () => {
      const request = createRequest(validUpdatePayload, "bearer valid-token");

      const response = await PUT(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 401 when Authorization header uses Basic instead of Bearer", async () => {
      const request = createRequest(validUpdatePayload, "Basic dXNlcjpwYXNz");

      const response = await PUT(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });
  });
});

describe("GET /api/users/[id] — user read endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createRequest(authHeader?: string): NextRequest {
    const headers = new Headers();
    if (authHeader !== undefined) {
      headers.set("Authorization", authHeader);
    }

    return new NextRequest("http://localhost:3000/api/users/target-user-id", {
      method: "GET",
      headers,
    });
  }

  const routeParams = { params: { id: "target-user-id" } };

  describe("authentication error cases", () => {
    it("should return 401 when Authorization header is missing", async () => {
      const request = createRequest();

      const response = await GET(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 401 when Authorization header has no Bearer prefix", async () => {
      const request = createRequest("some-token-without-bearer");

      const response = await GET(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 401 when Authorization header is empty Bearer", async () => {
      // Note: Headers API trims trailing whitespace, so "Bearer " becomes "Bearer"
      // This fails startsWith("Bearer ") check, returning "Authentication required"
      const request = createRequest("Bearer ");

      const response = await GET(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 401 when token is invalid", async () => {
      const request = createRequest("Bearer invalid-token");

      mockVerifyIdToken.mockRejectedValue(
        new Error("Decoding Firebase ID token failed")
      );

      const response = await GET(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Decoding Firebase ID token failed");
    });

    it("should return 401 when token is expired", async () => {
      const request = createRequest("Bearer expired-token");

      mockVerifyIdToken.mockRejectedValue(
        new Error("Firebase ID token has expired")
      );

      const response = await GET(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Firebase ID token has expired");
    });
  });

  describe("authorization error cases", () => {
    it("should return 404 when caller user is not found in Firestore", async () => {
      const request = createRequest("Bearer valid-token");

      mockVerifyIdToken.mockResolvedValue({ uid: "caller-uid-123" });
      mockGet.mockResolvedValue({ exists: false });

      const response = await GET(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });

    it("should return 403 when caller has role engineer", async () => {
      const request = createRequest("Bearer valid-token");

      mockVerifyIdToken.mockResolvedValue({ uid: "engineer-uid" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: "engineer", name: "Engineer User" }),
      });

      const response = await GET(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Admin access required");
    });

    it("should return 403 when caller has role user", async () => {
      const request = createRequest("Bearer valid-token");

      mockVerifyIdToken.mockResolvedValue({ uid: "user-uid" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: "user", name: "Regular User" }),
      });

      const response = await GET(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Admin access required");
    });

    it("should return 403 when caller has role client", async () => {
      const request = createRequest("Bearer valid-token");

      mockVerifyIdToken.mockResolvedValue({ uid: "client-uid" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ role: "client", name: "Client User" }),
      });

      const response = await GET(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Admin access required");
    });

    it("should return 403 when caller has no role defined", async () => {
      const request = createRequest("Bearer valid-token");

      mockVerifyIdToken.mockResolvedValue({ uid: "no-role-uid" });
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({ name: "User Without Role" }),
      });

      const response = await GET(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Admin access required");
    });
  });

  describe("success cases", () => {
    it("should return 200 and user data when caller is admin", async () => {
      const request = createRequest("Bearer valid-admin-token");

      mockVerifyIdToken.mockResolvedValue({ uid: "admin-uid" });

      // Mock implementation to return admin for auth check, then target user data
      let callCount = 0;
      mockGet.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: auth check for admin
          return Promise.resolve({
            exists: true,
            data: () => ({ role: "admin", name: "Admin User" }),
          });
        } else {
          // Second call: target user fetch
          return Promise.resolve({
            exists: true,
            id: "target-user-id",
            data: () => ({
              name: "Target User",
              email: "target@example.com",
              role: "engineer",
              isActive: true,
            }),
          });
        }
      });

      const response = await GET(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("target-user-id");
      expect(data.name).toBe("Target User");
      expect(data.email).toBe("target@example.com");
    });

    it("should return 404 when target user does not exist", async () => {
      const request = createRequest("Bearer valid-admin-token");

      mockVerifyIdToken.mockResolvedValue({ uid: "admin-uid" });

      // Mock: first call returns admin, second call returns non-existent user
      let callCount = 0;
      mockGet.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            exists: true,
            data: () => ({ role: "admin", name: "Admin User" }),
          });
        } else {
          return Promise.resolve({
            exists: false,
          });
        }
      });

      const response = await GET(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });
  });

  describe("edge cases", () => {
    it("should return 401 when Authorization header uses lowercase bearer", async () => {
      const request = createRequest("bearer valid-token");

      const response = await GET(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });

    it("should return 401 when Authorization header uses Basic instead of Bearer", async () => {
      const request = createRequest("Basic dXNlcjpwYXNz");

      const response = await GET(request, routeParams);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Authentication required");
    });
  });
});
