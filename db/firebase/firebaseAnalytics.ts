"use client";

import {
  getAnalytics as getFirebaseAnalytics,
  isSupported,
  Analytics,
  logEvent as firebaseLogEvent,
  setUserId,
  setUserProperties,
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
      console.log("Firebase Analytics initialized successfully");
      return analyticsInstance;
    } else {
      console.warn("Firebase Analytics is not supported in this environment");
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

// Wrapper for logEvent to ensure analytics exists
export function logEvent(eventName: string, eventParams?: Record<string, any>) {
  if (analyticsInstance) {
    firebaseLogEvent(analyticsInstance, eventName, eventParams);
    return true;
  }
  return false;
}

// Set user ID safely
export function setAnalyticsUserId(userId: string | null) {
  if (analyticsInstance && userId) {
    setUserId(analyticsInstance, userId);
    return true;
  }
  return false;
}

// Set user properties safely
export function setAnalyticsUserProperties(properties: Record<string, any>) {
  if (analyticsInstance) {
    setUserProperties(analyticsInstance, properties);
    return true;
  }
  return false;
}
