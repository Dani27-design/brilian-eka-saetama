"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import ContactEditor from "@/components/Admin/ContactEditor";

export default function EditContactPage({ params }) {
  const router = useRouter();
  const { section } = params;
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch document data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(firestore, "contact", section);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setData(docSnap.data());
        } else {
          // Initialize with empty data for new documents
          setData({ en: "", id: "" });
        }
      } catch (err) {
        console.error("Error fetching document:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [section]);

  // Handle form submission
  const handleSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, "contact", section), data, { merge: true });
      router.push("/admin/collections/contact");
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
      <ContactEditor
        collectionName="contact"
        documentId={section}
        initialData={data}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />
    </div>
  );
}
