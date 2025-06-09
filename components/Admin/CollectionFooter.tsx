"use client";

import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import FooterPreview from "./FooterPreview";

const CollectionFooter = ({ collectionName }) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const queryClient = useQueryClient();

  // Function to handle section editing
  const handleEditSection = (section: string) => {
    window.location.href = `/admin/collections/footer/edit/${section}`;
  };

  // Query function to fetch footer data
  const fetchFooterData = async () => {
    const querySnapshot = await getDocs(collection(firestore, collectionName));
    const data = {};

    querySnapshot.forEach((doc) => {
      data[doc.id] = doc.data();
    });

    return data;
  };

  // Use React Query for data fetching with caching
  const {
    data: footerData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`collection-${collectionName}`],
    queryFn: fetchFooterData,
    staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Data stays in cache for 10 minutes after becoming inactive
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    initialData: () => {
      // Return any cached data if available
      return queryClient.getQueryData([`collection-${collectionName}`]);
    },
  });

  // Handle error state
  if (error) {
    console.error("Error fetching footer data:", error);
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-black">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-3 rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium">Failed to load data</h3>
          <p className="text-sm text-gray-500">
            There was an error loading the footer section data
          </p>
          <button
            className="mt-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: [`collection-${collectionName}`],
              })
            }
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-black">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <FooterPreview
          data={footerData || {}}
          activeSection={activeSection}
          onEditSection={handleEditSection}
          previewMode={previewMode}
          onPreviewModeChange={setPreviewMode}
        />
      )}
    </div>
  );
};

export default CollectionFooter;
