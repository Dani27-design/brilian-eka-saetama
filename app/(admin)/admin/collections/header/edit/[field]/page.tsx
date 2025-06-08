"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import AdminPageHeader from "@/components/Admin/AdminPageHeader";
import HeaderEditor from "@/components/Admin/HeaderEditor";
import { useLanguage } from "@/app/context/LanguageContext";

export default function EditHeader({ params }) {
  const router = useRouter();
  const { language } = useLanguage();
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
          if (field === "logo_data") {
            setInitialData({
              en: {
                light: "/images/logo/logo-light.png",
                dark: "/images/logo/logo-dark.png",
              },
              id: {
                light: "/images/logo/logo-light.png",
                dark: "/images/logo/logo-dark.png",
              },
            });
          } else if (field === "menu_items") {
            setInitialData({
              en: [
                { title: "Home", path: "#home" },
                { title: "About", path: "#about" },
                { title: "Services", path: "#services" },
              ],
              id: [
                { title: "Beranda", path: "#home" },
                { title: "Tentang", path: "#about" },
                { title: "Layanan", path: "#services" },
              ],
            });
          } else if (field === "language_dropdown") {
            setInitialData({
              en: { en_text: "🇬🇧 English", id_text: "🇮🇩 Indonesia" },
              id: { en_text: "🇬🇧 English", id_text: "🇮🇩 Indonesia" },
            });
          } else {
            setInitialData({ en: "", id: "" });
          }
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
    setError(null);
    try {
      await setDoc(doc(firestore, "header", field), data);
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
