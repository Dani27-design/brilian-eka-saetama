"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import HeaderEditor from "@/components/Admin/HeaderEditor";

export default function EditHeader({ params }) {
  const router = useRouter();
  const { field } = params;
  const [initialData, setInitialData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(firestore, "header", field);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setInitialData(docSnap.data());
        } else {
          // Initialize with empty data for new documents
          setInitialData({ en: "", id: "" });
        }
      } catch (error) {
        console.error("Error fetching document:", error);
        setError("Failed to load document. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [field]);

  const handleSubmit = async (data) => {
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, "header", field), data, { merge: true });
      router.push("/admin/collections/header");
    } catch (error) {
      console.error("Error saving document:", error);
      setError("Failed to save document. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-10">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}
      <HeaderEditor
        collectionName="header"
        documentId={field}
        initialData={initialData}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />
    </div>
  );
}
