import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminFirestore } from "@/db/firebase/firebaseAdmin";

export async function verifyAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);

    if (!adminFirestore) {
      return NextResponse.json(
        { error: "Failed to initialize Firestore" },
        { status: 500 }
      );
    }

    const callerDoc = await adminFirestore
      .collection("users")
      .doc(decodedToken.uid)
      .get();

    if (!callerDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const callerData = callerDoc.data();

    if (callerData?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return null;
  } catch (error: any) {
    console.error("Auth verification error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 401 }
    );
  }
}
