"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import ServiceEditor from "@/components/Admin/ServiceEditor";

export default function EditServicesSection({ params }) {
  const router = useRouter();
  const { section } = params;
  const [data, setData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(firestore, "services", section);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setData(docSnap.data());
        } else {
          // Handle case where document doesn't exist - initialize with empty data
          setData({ en: "", id: "" });
        }
      } catch (error) {
        console.error("Error fetching document:", error);
        setError("Failed to load document. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [section]);

  const handleSubmit = async (formData: any) => {
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, "services", section), formData, {
        merge: true,
      });
      router.push("/admin/collections/services");
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
      <ServiceEditor
        collectionName="services"
        documentId={section}
        initialData={data}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />
    </div>
  );
}
