"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import HeaderPreview from "./HeaderPreview";

const CollectionHeader = ({ collectionName }) => {
  const [headerData, setHeaderData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );

  // Function to handle section editing
  const handleEditSection = (section: string) => {
    window.location.href = `/admin/collections/header/edit/${section}`;
  };

  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        setIsLoading(true);

        // Get all documents from the header collection
        const querySnapshot = await getDocs(
          collection(firestore, collectionName),
        );
        const data = {};

        querySnapshot.forEach((doc) => {
          data[doc.id] = doc.data();
        });

        setHeaderData(data);
      } catch (error) {
        console.error("Error fetching header data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (collectionName === "header") {
      fetchHeaderData();
    }
  }, [collectionName]);

  return (
    <div className="rounded-lg border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-black">
      <HeaderPreview
        data={headerData}
        activeSection={activeSection}
        previewMode={previewMode}
        onPreviewModeChange={setPreviewMode}
        onEditSection={handleEditSection}
      />
    </div>
  );
};

export default CollectionHeader;
