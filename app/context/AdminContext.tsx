"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { auth, firestore } from "@/db/firebase/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type AdminUser = {
  uid: string;
  email: string | null;
  name: string | null;
  role: "admin" | "engineer" | "user";
  isActive: boolean;
};

type AdminContextType = {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
};

const AdminContext = createContext<AdminContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signOut: async () => {},
});

export const useAdmin = () => useContext(AdminContext);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    // Skip auth listener setup if we're in the middle of signing out
    if (isSigningOut) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: userData.name || null,
            role: userData.role || "user",
            isActive: userData.isActive !== false,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error instanceof Error ? error.message : "Unknown error");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isSigningOut]);

  // Centralized sign out function that all components should use
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      setUser(null); // Immediately clear user state
      setIsLoading(true);

      // Actually sign out from Firebase
      await signOut(auth);
    } catch (error) {
      console.error("Error in context signOut:", error instanceof Error ? error.message : "Unknown error");
      setIsSigningOut(false);
      return Promise.reject(error);
    }
  };

  return (
    <AdminContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated:
          !!user &&
          user.isActive &&
          (user.role === "admin" || user.role === "engineer"),
        signOut: handleSignOut,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}
