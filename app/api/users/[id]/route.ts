import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminFirestore } from "../../../../db/firebase/firebaseAdmin";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const { name, email, role, isActive, password } = await request.json();

    if (!adminFirestore) {
      console.error("Admin Firestore is not available");
      return NextResponse.json(
        { error: "Failed to initialize Firestore" },
        { status: 500 },
      );
    }

    // Prepare update data for Firebase Auth
    const authUpdateData: any = {
      displayName: name,
      email: email,
    };

    // Only update password if provided
    if (password && password.trim() !== "") {
      authUpdateData.password = password;
    }

    // Update user in Firebase Auth
    await getAuth().updateUser(userId, authUpdateData);

    // Update user document in Firestore
    const userDocRef = adminFirestore.collection("users").doc(userId);
    await userDocRef.update({
      name,
      email,
      role,
      isActive,
      updatedAt: new Date(),
    });

    return NextResponse.json({ 
      success: true, 
      message: "User updated successfully" 
    });

  } catch (error: any) {
    console.error("Error updating user:", error);
    
    // Handle specific Firebase Auth errors
    let errorMessage = "Failed to update user";
    
    if (error.code === "auth/email-already-exists") {
      errorMessage = "Email is already in use by another user";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email format";
    } else if (error.code === "auth/user-not-found") {
      errorMessage = "User not found";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!adminFirestore) {
      console.error("Admin Firestore is not available");
      return NextResponse.json(
        { error: "Failed to initialize Firestore" },
        { status: 500 },
      );
    }

    // Get user document from Firestore
    const userDoc = await adminFirestore.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const userData = userDoc.data();
    
    return NextResponse.json({
      id: userDoc.id,
      ...userData,
    });

  } catch (error: any) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user" },
      { status: 500 },
    );
  }
}