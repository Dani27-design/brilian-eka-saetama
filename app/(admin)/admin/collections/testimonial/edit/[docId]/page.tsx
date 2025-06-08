"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import TestimonialEditor from "@/components/Admin/TestimonialEditor";

export default function EditTestimonialPage({ params }) {
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
        const docRef = doc(firestore, "testimonial", docId);
        const docSnapshot = await getDoc(docRef);

        if (docSnapshot.exists()) {
          setInitialData(docSnapshot.data());
        } else {
          // For new documents, initialize with empty data structure
          if (docId === "testimonial_title") {
            setInitialData({ en: "TESTIMONIALS", id: "TESTIMONI" });
          } else if (docId === "testimonial_subtitle") {
            setInitialData({
              en: "Client's Testimonials",
              id: "Testimoni Klien",
            });
          } else if (docId === "testimonial_description") {
            setInitialData({
              en: "See what our clients say about our services and products.",
              id: "Lihat apa yang klien kami katakan tentang layanan dan produk kami.",
            });
          } else if (docId === "testimonials") {
            setInitialData({
              en: [
                {
                  id: 1,
                  name: "John Doe",
                  designation: "CEO, Company Inc.",
                  image: "/images/user/user-01.png",
                  content:
                    "Working with this team has been an incredible experience! They delivered beyond our expectations and truly understood our vision.",
                },
              ],
              id: [
                {
                  id: 1,
                  name: "John Doe",
                  designation: "CEO, Perusahaan Inc.",
                  image: "/images/user/user-01.png",
                  content:
                    "Bekerja dengan tim ini adalah pengalaman luar biasa! Mereka memberikan hasil melebihi ekspektasi kami dan benar-benar memahami visi kami.",
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
    setIsSaving(true);
    try {
      setError(null);

      // Save data to Firestore
      await setDoc(doc(firestore, "testimonial", docId), data, { merge: true });

      // Redirect back to collection page
      window.location.href = "/admin/collections/testimonial";
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

      <TestimonialEditor
        collectionName="testimonial"
        documentId={docId}
        initialData={initialData}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />
    </div>
  );
}
