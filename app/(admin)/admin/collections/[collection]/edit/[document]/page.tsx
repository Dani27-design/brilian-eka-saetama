"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useLanguage } from "@/app/context/LanguageContext";
import DocumentForm from "@/components/Admin/DocumentForm";
import { firestore } from "@/db/firebase/firebaseConfig";

export default function EditDocumentPage({
  params,
}: {
  params: { collection: string; document: string };
}) {
  const [document, setDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { language } = useLanguage();
  const router = useRouter();
  const { collection: collectionName, document: documentId } = params;

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(firestore, collectionName, documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setDocument(docSnap.data());
        } else {
          setError("Document not found");
        }
      } catch (error) {
        console.error(`Error fetching document:`, error);
        setError("Failed to load document");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [collectionName, documentId]);

  const handleSave = async (data: any) => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      const docRef = doc(firestore, collectionName, documentId);
      await updateDoc(docRef, data);

      setSuccess("Document updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error(`Error updating document:`, error);
      setError("Failed to update document");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Edit Document: {documentId}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Collection: {collectionName}
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="rounded-lg border border-stroke bg-white px-4 py-2 text-black transition hover:bg-gray-100 dark:border-strokedark dark:bg-black dark:text-white dark:hover:bg-gray-800"
        >
          Back
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-500 dark:bg-green-900/30 dark:text-green-400">
          {success}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-lg border border-stroke bg-white p-6 dark:border-strokedark dark:bg-black">
          <div className="h-80 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"></div>
        </div>
      ) : document ? (
        <DocumentForm
          initialData={document}
          onSubmit={handleSave}
          isSaving={isSaving}
          language={language}
        />
      ) : (
        <div className="rounded-lg border border-stroke bg-white p-6 dark:border-strokedark dark:bg-black">
          <p className="text-center text-gray-500 dark:text-gray-400">
            Document not found
          </p>
        </div>
      )}
    </div>
  );
}
