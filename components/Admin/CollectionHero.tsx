"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import HeroPreview from "./HeroPreview";

const CollectionHero = ({ collectionName }) => {
  const [heroData, setHeroData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );

  // Function to handle section editing
  const handleEditSection = (section: string) => {
    window.location.href = `/admin/collections/hero/edit/${section}`;
  };

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        setIsLoading(true);

        // Get all documents from the hero collection
        const querySnapshot = await getDocs(
          collection(firestore, collectionName),
        );
        const data = {};

        querySnapshot.forEach((doc) => {
          data[doc.id] = doc.data();
        });

        setHeroData(data);
      } catch (error) {
        console.error("Error fetching hero data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (collectionName === "hero") {
      fetchHeroData();
    }
  }, [collectionName]);

  return (
    <div className="rounded-lg border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-black">
      <HeroPreview
        data={heroData}
        activeSection={activeSection}
        previewMode={previewMode}
        onPreviewModeChange={setPreviewMode}
        onEditSection={handleEditSection}
      />
    </div>
  );
};

export default CollectionHero;
