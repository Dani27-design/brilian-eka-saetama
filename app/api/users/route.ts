import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminFirestore } from "../../../db/firebase/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
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
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 },
    );
  }
}
