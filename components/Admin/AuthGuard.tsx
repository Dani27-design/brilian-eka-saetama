"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, firestore } from "@/db/firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Static translations without language context
const messages = {
  unauthorized: {
    id: "Akses ditolak. Anda tidak memiliki izin untuk mengakses halaman admin.",
    en: "Access denied. You don't have permission to access the admin pages.",
  },
  sessionExpired: {
    id: "Sesi Anda telah berakhir. Silakan login kembali.",
    en: "Your session has expired. Please log in again.",
  },
};

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  // Get browser language or default to English
  const getBrowserLanguage = () => {
    if (typeof window !== "undefined") {
      const lang = navigator.language.substring(0, 2);
      return lang === "id" ? "id" : "en";
    }
    return "en";
  };

  const language = getBrowserLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // No user is signed in
        setIsLoading(false);
        setIsAuthorized(false);
        router.push("/");

        // Show alert after slight delay to ensure it appears after navigation starts
        setTimeout(() => {
          alert(messages.sessionExpired[language as "id" | "en"]);
        }, 100);

        return;
      }

      try {
        // Check if user has proper role in Firestore
        const userDoc = await getDoc(doc(firestore, "users", user.uid));

        if (!userDoc.exists()) {
          // User authenticated but not in Firestore users collection
          await auth.signOut();
          setIsAuthorized(false);
          router.push("/");
          setTimeout(() => {
            alert(messages.unauthorized[language as "id" | "en"]);
          }, 100);
          return;
        }

        const userData = userDoc.data();

        // Check if user role is admin or engineer and account is active
        if (
          (userData.role === "admin" || userData.role === "engineer") &&
          userData.isActive !== false
        ) {
          // User is authorized
          setIsAuthorized(true);
        } else {
          // User doesn't have proper role, sign them out
          await auth.signOut();
          setIsAuthorized(false);
          router.push("/");
          setTimeout(() => {
            alert(messages.unauthorized[language as "id" | "en"]);
          }, 100);
        }
      } catch (error) {
        console.error("Error checking user permissions:", error);
        await auth.signOut();
        setIsAuthorized(false);
        router.push("/");
        setTimeout(() => {
          alert(messages.unauthorized[language as "id" | "en"]);
        }, 100);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, language]);

  // Show nothing while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
      </div>
    );
  }

  // If authorized, show the children (admin pages)
  return isAuthorized ? <>{children}</> : null;
}
