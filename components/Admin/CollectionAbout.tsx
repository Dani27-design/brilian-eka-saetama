"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import AboutPreview from "./AboutPreview";

const CollectionAbout = ({ collectionName }) => {
  const [aboutData, setAboutData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );

  // Function to handle section editing
  const handleEditSection = (section: string) => {
    window.location.href = `/admin/collections/about/edit/${section}`;
  };

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        setIsLoading(true);

        // Get all documents from the about collection
        const querySnapshot = await getDocs(
          collection(firestore, collectionName),
        );
        const data = {};

        querySnapshot.forEach((doc) => {
          data[doc.id] = doc.data();
        });

        setAboutData(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching about data:", error);
        setIsLoading(false);
      }
    };

    fetchAboutData();
  }, [collectionName]);

  return (
    <div className="rounded-lg border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-black">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <AboutPreview
          data={aboutData}
          activeSection={activeSection}
          onEditSection={handleEditSection}
          previewMode={previewMode}
          onPreviewModeChange={setPreviewMode}
        />
      )}
    </div>
  );
};

export default CollectionAbout;
