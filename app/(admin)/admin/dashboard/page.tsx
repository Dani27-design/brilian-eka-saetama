"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, firestore } from "@/db/firebase/firebaseConfig";

export default function AdminDashboard() {
  const [collections, setCollections] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        // This is a workaround to list Firestore collections
        // In a real app, you might want to store collection metadata
        const snapshot = await getDocs(collection(firestore, "collections"));
        const collectionsData = snapshot.docs.map((doc) => doc.id);
        setCollections(collectionsData);
      } catch (error) {
        console.error("Error fetching collections:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
            ></div>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {collections.length > 0 ? (
            collections.map((collection) => (
              <div
                key={collection}
                className="rounded-lg border border-stroke bg-white p-4 shadow-sm dark:border-strokedark dark:bg-black"
              >
                <h2 className="mb-2 text-xl font-medium">{collection}</h2>
                <button
                  onClick={() =>
                    router.push(`/admin/collections/${collection}`)
                  }
                  className="mt-2 text-primary hover:underline"
                >
                  Manage {collection} →
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-3 rounded-lg border border-stroke bg-white p-4 text-center dark:border-strokedark dark:bg-black">
              <p>No collections found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
