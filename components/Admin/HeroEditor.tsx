"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "next-themes";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import HeroPreview from "./HeroPreview";
import debounce from "lodash/debounce";

interface HeroEditorProps {
  collectionName: string;
  documentId: string;
  initialData: any;
  onSubmit: (data: any) => Promise<void>;
  isSaving: boolean;
}

const HeroEditor = ({
  collectionName,
  documentId,
  initialData,
  onSubmit,
  isSaving,
}: HeroEditorProps) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [formData, setFormData] = useState<any>(
    initialData || { en: "", id: "" },
  );
  const [fullHeroData, setFullHeroData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>(language || "en");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );

  // For immediate UI updates (local state)
  const [localInputValue, setLocalInputValue] = useState("");

  // Initialize local input value when active tab changes or form data updates
  useEffect(() => {
    if (formData && formData[activeTab] !== undefined) {
      setLocalInputValue(formData[activeTab]);
    } else {
      setLocalInputValue(""); // Reset to empty string if no data exists
    }
  }, [formData, activeTab]);

  // Fetch all hero data initially
  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        // Build complete hero data from all documents
        const docTypes = [
          "hero_title",
          "hero_subtitle",
          "hero_slogan",
          "email_placeholder",
          "button_text",
        ];
        const data = {};

        for (const docType of docTypes) {
          const docRef = doc(firestore, "hero", docType);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            data[docType] = docSnap.data();
          }
        }

        setFullHeroData(data);
      } catch (error) {
        console.error("Error fetching hero data:", error);
      }
    };

    fetchHeroData();
  }, []); // Only fetch once on component mount

  // Update only the current document in the preview data
  useEffect(() => {
    // Skip preview updates during typing to prevent lag
    if (
      document.activeElement?.tagName === "INPUT" ||
      document.activeElement?.tagName === "TEXTAREA"
    ) {
      return;
    }

    // Use a timeout to debounce expensive operations
    const updateTimer = setTimeout(() => {
      setFullHeroData((prevData) => {
        // Create a deep copy of the previous state
        const updatedData = JSON.parse(JSON.stringify(prevData));

        // Only update the current document, preserving other data
        if (documentId && updatedData) {
          // If the document already exists in preview data, update it without replacing other language data
          if (updatedData[documentId]) {
            updatedData[documentId] = {
              ...updatedData[documentId], // Preserve other language data
              ...formData, // Update with new data
            };
          } else {
            // If it doesn't exist yet, add it
            updatedData[documentId] = formData;
          }
        }

        return updatedData;
      });
    }, 500);

    return () => clearTimeout(updateTimer);
  }, [formData, documentId]);

  // Make sure formData is properly initialized when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);

      // Also initialize the local input value for responsive UI
      if (initialData[activeTab]) {
        setLocalInputValue(initialData[activeTab]);
      }
    }
  }, [initialData, activeTab]);

  // Handle form data change with debouncing
  const handleFormChange = useCallback(
    (value) => {
      setFormData((prev) => ({
        ...prev,
        [activeTab]: value,
      }));
    },
    [activeTab],
  );

  // Create a debounced version of the form update function
  const debouncedFormUpdate = useCallback(
    debounce((value) => {
      handleFormChange(value);
    }, 500),
    [handleFormChange],
  );

  // Handle input changes - optimized for better performance
  const handleInputChange = (e) => {
    const value = e.target.value;

    // Update local state immediately for responsive UI
    setLocalInputValue(value);

    // Debounce the update to formData to prevent lag
    debouncedFormUpdate(value);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Handle which section to edit
  const handleEditSection = (section: string) => {
    if (section !== documentId) {
      window.location.href = `/admin/collections/hero/edit/${section}`;
    }
  };

  // Render form fields based on the document type
  const renderFormFields = () => {
    // Get current value from local state for responsive typing
    const currentValue = localInputValue || "";

    switch (documentId) {
      case "hero_title":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Hero Title
              </label>
              <p className="mb-2 text-sm text-gray-500">
                Use parentheses () to highlight part of the text. Example: "We
                provide the best (solutions) for your business"
              </p>
              <input
                type="text"
                value={currentValue}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="We provide the best (solutions) for your business"
              />
            </div>
          </div>
        );

      case "hero_subtitle":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Hero Subtitle
              </label>
              <textarea
                value={currentValue}
                onChange={handleInputChange}
                className="h-24 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter a descriptive subtitle for the hero section"
              />
            </div>
          </div>
        );

      case "hero_slogan":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Hero Slogan
              </label>
              <input
                type="text"
                value={currentValue}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your company slogan"
              />
            </div>
          </div>
        );

      case "email_placeholder":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Email Input Placeholder
              </label>
              <input
                type="text"
                value={currentValue}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter email address"
              />
            </div>
          </div>
        );

      case "button_text":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Button Text
              </label>
              <input
                type="text"
                value={currentValue}
                onChange={handleInputChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Connect with us"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="rounded-md border bg-yellow-50 p-4 text-yellow-700">
            <p>No specific editor available for this document type.</p>
          </div>
        );
    }
  };

  // Memoize the form fields to prevent unnecessary re-renders
  const memoizedFormFields = useMemo(() => {
    return renderFormFields();
  }, [documentId, activeTab, localInputValue]); // Only re-render when these change

  return (
    <div className="space-y-8">
      {/* Hero preview component - memoized to prevent re-renders during typing */}
      {useMemo(
        () =>
          fullHeroData && Object.keys(fullHeroData).length > 0 ? (
            <HeroPreview
              data={fullHeroData}
              activeSection={documentId}
              onEditSection={handleEditSection}
              previewMode={previewMode}
              onPreviewModeChange={setPreviewMode}
            />
          ) : (
            <div className="rounded-md border bg-gray-50 p-6 text-center text-gray-500">
              Loading preview...
            </div>
          ),
        [fullHeroData, documentId, previewMode],
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-black"
      >
        <h2 className="mb-4 text-xl font-bold capitalize">Form Editor</h2>

        {/* Language tabs */}
        <div className="mb-4 border-b border-stroke dark:border-strokedark">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab("en")}
              className={`px-4 py-2 ${
                activeTab === "en"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-black dark:hover:text-white"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("id")}
              className={`px-4 py-2 ${
                activeTab === "id"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-500 hover:text-black dark:hover:text-white"
              }`}
            >
              Indonesia
            </button>
          </div>
        </div>

        <div className="h-fit">{memoizedFormFields}</div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-lg border border-stroke bg-white px-4 py-2 hover:bg-gray-100 dark:border-strokedark dark:bg-black dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HeroEditor;
