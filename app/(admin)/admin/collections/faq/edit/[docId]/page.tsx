"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import FAQEditor from "@/components/Admin/FAQEditor";

export default function EditFAQPage({ params }) {
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
        const docRef = doc(firestore, "faq", docId);
        const docSnapshot = await getDoc(docRef);

        if (docSnapshot.exists()) {
          setInitialData(docSnapshot.data());
        } else {
          // For new documents, initialize with empty data structure
          if (docId === "faq_title") {
            setInitialData({ en: "OUR FAQS", id: "TANYA JAWAB KAMI" });
          } else if (docId === "faq_subtitle") {
            setInitialData({
              en: "Frequently Asked Questions",
              id: "Pertanyaan yang Sering Diajukan",
            });
          } else if (docId === "faq_items") {
            setInitialData({
              en: [
                {
                  id: 1,
                  question: "What services do you offer?",
                  answer:
                    "We offer a wide range of services including web development, mobile app development, and IT consulting.",
                },
              ],
              id: [
                {
                  id: 1,
                  question: "Layanan apa yang Anda tawarkan?",
                  answer:
                    "Kami menawarkan berbagai layanan termasuk pengembangan web, pengembangan aplikasi mobile, dan konsultasi IT.",
                },
              ],
            });
          } else {
            // Default empty data
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

    fetchDocument();
  }, [docId]);

  // Handle form submission
  const handleSubmit = async (data: any) => {
    try {
      setIsSaving(true);
      setError(null);

      // Save data to Firestore
      await setDoc(doc(firestore, "faq", docId), data, { merge: true });

      // Redirect back to faq collection page after successful save
      window.location.href = "/admin/collections/faq";
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

      <FAQEditor
        collectionName="faq"
        documentId={docId}
        initialData={initialData}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />
    </div>
  );
}
