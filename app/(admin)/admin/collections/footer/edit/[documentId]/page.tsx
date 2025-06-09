"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import AdminPageHeader from "@/components/Admin/AdminPageHeader";
import FooterEditor from "@/components/Admin/FooterEditor";

type EditFooterPageProps = {
  params: {
    documentId: string;
  };
};

export default function EditFooterPage({ params }: EditFooterPageProps) {
  const router = useRouter();
  const { documentId } = params;
  const [documentData, setDocumentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch document data on component mount
  useEffect(() => {
    const fetchDocumentData = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(firestore, "footer", documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setDocumentData(docSnap.data());
        } else {
          // Initialize with empty data if document doesn't exist
          setDocumentData({
            en: {},
            id: {},
          });
        }
      } catch (err) {
        console.error("Error fetching document:", err);
        setError("Failed to load document. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocumentData();
  }, [documentId]);

  // Handle form submission
  const handleSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, "footer", documentId), data, { merge: true });
      router.push("/admin/collections/footer");
    } catch (err) {
      console.error("Error updating document:", err);
      setError("Failed to save changes. Please try again.");
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
      <FooterEditor
        collectionName="footer"
        documentId={documentId}
        initialData={documentData}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />
    </div>
  );
}
