"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import ServiceEditor from "@/components/Admin/ServiceEditor";
import AdminPageHeader from "@/components/Admin/AdminPageHeader";
import { toast } from "react-hot-toast";

export default function EditServicesSection() {
  const router = useRouter();
  const params = useParams();
  const section = params.section as string;

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(firestore, "services", section);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setData(docSnap.data());
        } else {
          // Handle case where document doesn't exist - initialize with empty data
          setData({ en: "", id: "" });
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching document:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (section) {
      fetchData();
    }
  }, [section]);

  const handleSubmit = async (formData: any) => {
    setIsSaving(true);
    try {
      const docRef = doc(firestore, "services", section);
      await updateDoc(docRef, formData);
      toast.success("Changes saved successfully!");
      // Navigate back to services management page
      router.push("/admin/collections/services");
    } catch (err) {
      console.error("Error updating document:", err);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md p-4">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <p>{error}</p>
          <button
            className="mt-2 rounded bg-red-100 px-4 py-2 font-medium text-red-800"
            onClick={() => router.push("/admin/collections/services")}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
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
