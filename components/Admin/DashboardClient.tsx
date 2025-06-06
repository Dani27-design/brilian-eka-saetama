"use client";

import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, firestore } from "@/db/firebase/firebaseConfig";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CollectionData {
  id: string;
  documentCount: number;
  sampleDocuments: { id: string; data: any }[];
}

export default function AdminDashboard() {
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCollections = async () => {
      setIsLoading(true);
      try {
        const knownCollections = [
          "header",
          "hero",
          "services",
          "about",
          "clients",
          "clientsInfo",
          "faq",
          "testimonial",
          "contact",
          "blog",
          "footer",
        ];

        const collectionsData: CollectionData[] = [];

        for (const collectionId of knownCollections) {
          try {
            const q = query(collection(firestore, collectionId), limit(5));
            const querySnapshot = await getDocs(q);
            const documents = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              data: doc.data(),
            }));

            collectionsData.push({
              id: collectionId,
              documentCount: querySnapshot.size,
              sampleDocuments: documents,
            });
          } catch (error) {
            console.log(`Collection ${collectionId} might not exist`);
          }
        }

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
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-black dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage all your website content
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
            ></div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="overflow-hidden rounded-lg border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-black"
            >
              <div className="flex items-center justify-between border-b border-stroke bg-gray-50 px-6 py-4 dark:border-strokedark dark:bg-gray-800">
                <h2 className="text-xl font-semibold capitalize text-black dark:text-white">
                  {collection.id}
                </h2>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {collection.documentCount} docs
                </span>
              </div>

              <div className="px-6 py-4">
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Sample Documents:
                  </h3>
                  <ul className="divide-y divide-stroke text-sm dark:divide-strokedark">
                    {collection.sampleDocuments.length > 0 ? (
                      collection.sampleDocuments.map((doc) => (
                        <li key={doc.id} className="truncate py-1">
                          • <span className="font-medium">{doc.id}</span>
                        </li>
                      ))
                    ) : (
                      <li className="py-1 text-gray-500">No documents found</li>
                    )}
                  </ul>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Link
                    href={`/admin/collections/${collection.id}`}
                    className="text-primary hover:underline"
                  >
                    View all documents
                  </Link>
                  <Link
                    href={`/admin/collections/${collection.id}/create`}
                    className="rounded bg-primary/10 px-3 py-1 text-primary hover:bg-primary/20"
                  >
                    Add new
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
