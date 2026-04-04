import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminFirestore } from "../../../db/firebase/firebaseAdmin";
import { verifyAdminAuth } from "@/utils/auth";

export async function POST(request: NextRequest) {
  try {
    const authError = await verifyAdminAuth(request);
    if (authError) {
      return authError;
    }

    const { email, password, name, role } = await request.json();

    // Create user with Firebase Admin SDK
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: name,
    });

    if (!adminFirestore) {
      console.error("Admin Firestore is not available");
      return NextResponse.json(
        { error: "Failed to initialize Firestore" },
        { status: 500 },
      );
    }

    // Use the exported adminFirestore instance
    await adminFirestore.collection("users").doc(userRecord.uid).set({
      email,
      name,
      role,
      isActive: true,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, userId: userRecord.uid });
  } catch (error: any) {
    console.error("Error creating user:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 },
    );
  }
}
