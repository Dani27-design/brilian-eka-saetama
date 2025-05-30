"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, setDoc } from "firebase/firestore";
import { useLanguage } from "@/app/context/LanguageContext";
import DocumentForm from "@/components/Admin/DocumentForm";
import { firestore } from "@/db/firebase/firebaseConfig";

export default function CreateDocumentPage({
  params,
}: {
  params: { collection: string };
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { language } = useLanguage();
  const router = useRouter();
  const { collection: collectionName } = params;

  const handleCreate = async (data: any) => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      // Generate a new document ID or use provided one
      const docId = data.id || doc(collection(firestore, collectionName)).id;
      delete data.id; // Remove id field if it exists

      // Set the document with the data
      await setDoc(doc(firestore, collectionName, docId), data);

      setSuccess("Document created successfully");
      setTimeout(() => {
        router.push(`/admin/collections/${collectionName}`);
      }, 1500);
    } catch (error) {
      console.error(`Error creating document:`, error);
      setError("Failed to create document");
    } finally {
      setIsSaving(false);
    }
  };

  // Initial empty document data with both languages
  const emptyDocument = {
    en: "",
    id: "",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Create New Document
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

      <DocumentForm
        initialData={emptyDocument}
        onSubmit={handleCreate}
        isSaving={isSaving}
        language={language}
        isCreating={true}
      />
    </div>
  );
}
