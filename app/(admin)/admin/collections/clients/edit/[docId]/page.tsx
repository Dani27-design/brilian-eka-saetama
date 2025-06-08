"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import ClientsEditor from "@/components/Admin/ClientsEditor";

export default function EditClientsPage({ params }) {
  const { docId } = params;
  const { language } = useLanguage();
  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(firestore, "clients", docId);
        const docSnapshot = await getDoc(docRef);

        if (docSnapshot.exists()) {
          setInitialData(docSnapshot.data());
        } else {
          // If document doesn't exist, initialize with empty data
          setInitialData({ en: "", id: "" });
        }
      } catch (error) {
        console.error("Error fetching document:", error);
        setError("Failed to load document. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [docId]);

  // Handle form submission
  const handleSubmit = async (data: any) => {
    try {
      setIsSaving(true);
      setError(null);

      // Save data to Firestore
      await setDoc(doc(firestore, "clients", docId), data, { merge: true });

      // Redirect back to clients collection page after successful save
      window.location.href = "/admin/collections/clients";
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
      <ClientsEditor
        collectionName="clients"
        documentId={docId}
        initialData={initialData}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />
    </div>
  );
}
