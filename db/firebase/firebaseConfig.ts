// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);

// // Initialize Firestore
// const firestore = getFirestore(app);

// // Initialize Firebase Authentication
// const auth = getAuth(app);

// // Dynamically import analytics (client-side only)
// let analytics;
// if (typeof window !== "undefined") {
//   import("firebase/analytics")
//     .then(({ getAnalytics }) => {
//       analytics = getAnalytics(app);
//     })
//     .catch((error) => {
//       console.error("Error loading Firebase analytics:", error);
//     });
// }

let app, firestore, auth, analytics, storage;

if (typeof window !== "undefined") {
  try {
    app = initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    auth = getAuth(app);
    analytics = getAnalytics(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Firebase initialization error", error);
  }
}
export { firestore, auth, analytics, storage };
