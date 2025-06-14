import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
function initializeFirebaseAdmin() {
  const apps = getApps();

  if (!apps.length) {
    // Ensure we have a service account key
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.error("Firebase service account key is missing");
      return null;
    }

    try {
      // Parse the service account key from the environment variable
      const serviceAccount = JSON.parse(
        Buffer.from(
          process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
          "base64",
        ).toString(),
      );

      return initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } catch (error) {
      console.error("Failed to initialize Firebase Admin:", error);
      return null;
    }
  }

  return getApps()[0];
}

// Initialize the app
const app = initializeFirebaseAdmin();

// Export Firestore instance if app was initialized successfully
export const adminFirestore = app ? getFirestore() : null;
