"use client";

import {
  getAnalytics as getFirebaseAnalytics,
  isSupported,
  Analytics,
} from "firebase/analytics";
import { app } from "./firebaseConfig";

// Analytics instance that's only created on the client
let analyticsInstance: Analytics | null = null;

// Safe initialization function
export async function initializeAnalytics() {
  if (typeof window === "undefined") return null;

  try {
    // Check if analytics is supported in this environment
    const analyticsSupported = await isSupported();

    if (analyticsSupported) {
      analyticsInstance = getFirebaseAnalytics(app);
      return analyticsInstance;
    } else {
      console.log("Analytics not supported in this environment");
    }
  } catch (error) {
    console.error("Failed to initialize analytics:", error);
  }

  return null;
}

// Safe getter
export function getAnalytics() {
  return analyticsInstance;
}
