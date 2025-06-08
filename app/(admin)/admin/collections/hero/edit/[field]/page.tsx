"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import AdminPageHeader from "@/components/Admin/AdminPageHeader";
import HeroEditor from "@/components/Admin/HeroEditor";

export default function EditHero({ params }) {
  const router = useRouter();
  const { field } = params;
  const [initialData, setInitialData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const docRef = doc(firestore, "hero", field);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setInitialData(docSnap.data());
        } else {
          // Initialize with empty data for new documents
          setInitialData({ en: "", id: "" });
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      }
    };

    fetchInitialData();
  }, [field]);

  const handleSubmit = async (data) => {
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, "hero", field), data);
      router.push("/admin/collections/hero");
    } catch (error) {
      console.error("Error saving document:", error);
      alert("Error saving the document. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto">
      <HeroEditor
        collectionName="hero"
        documentId={field}
        initialData={initialData}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />
    </div>
  );
}
