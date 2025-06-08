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

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
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
        setError("Failed to load header data. Please try refreshing the page.");
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
      setError("Error saving changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Generate a human-friendly title
  const getTitle = () => {
    switch (field) {
      case "logo_data":
        return "Logo";
      case "menu_items":
        return "Navigation Menu";
      case "language_dropdown":
        return "Language Options";
      default:
        return field.replace(/_/g, " ");
    }
  };

  return (
    <div className="container mx-auto max-w-5xl">
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
