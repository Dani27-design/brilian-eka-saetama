"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import ServicePreview from "./ServicePreview";

const CollectionServices = ({ collectionName }) => {
  const [servicesData, setServicesData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );

  // Function to handle section editing
  const handleEditSection = (section: string) => {
    window.location.href = `/admin/collections/services/edit/${section}`;
  };

  useEffect(() => {
    const fetchServicesData = async () => {
      try {
        setIsLoading(true);

        // Get all documents from the services collection
        const querySnapshot = await getDocs(
          collection(firestore, collectionName),
        );
        const data = {};

        querySnapshot.forEach((doc) => {
          data[doc.id] = doc.data();
        });

        setServicesData(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching services data:", error);
        setIsLoading(false);
      }
    };

    fetchServicesData();
  }, [collectionName]);

  return (
    <div className="rounded-lg border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-black">
      <ServicePreview
        data={servicesData}
        activeSection={activeSection}
        onEditSection={handleEditSection}
        previewMode={previewMode}
        onPreviewModeChange={setPreviewMode}
      />
    </div>
  );
};

export default CollectionServices;
