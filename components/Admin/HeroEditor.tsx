"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import Link from "next/link";
import HeroPreview from "./HeroPreview";

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
  // Initialize formData properly with initialData
  const [formData, setFormData] = useState<any>(
    initialData || { en: "", id: "" },
  );
  const [fullHeroData, setFullHeroData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>("en");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );

  // Load all hero related data for the preview
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

        // If current document is one of these, use our form data for preview
        if (docTypes.includes(documentId)) {
          data[documentId] = formData;
        }

        setFullHeroData(data);
      } catch (error) {
        console.error("Error fetching hero data:", error);
      }
    };

    fetchHeroData();
  }, [documentId, formData, activeTab]);

  // Make sure formData is properly initialized when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Handle form data change
  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [activeTab]: value,
    }));
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
    // Make sure we have a default value even if formData[activeTab] is undefined
    const currentValue =
      formData && formData[activeTab] ? formData[activeTab] : "";

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
                onChange={(e) => handleFormChange("", e.target.value)}
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
                onChange={(e) => handleFormChange("", e.target.value)}
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
                onChange={(e) => handleFormChange("", e.target.value)}
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
                onChange={(e) => handleFormChange("", e.target.value)}
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
                onChange={(e) => handleFormChange("", e.target.value)}
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

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-black">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-black dark:text-white">
            Hero Preview
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/collections/hero/edit/hero_title`}
              className="rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
            >
              Edit Title
            </Link>
            <Link
              href={`/admin/collections/hero/edit/hero_subtitle`}
              className="rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
            >
              Edit Subtitle
            </Link>
            <Link
              href={`/admin/collections/hero/edit/hero_slogan`}
              className="rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
            >
              Edit Slogan
            </Link>
            <Link
              href={`/admin/collections/hero/edit/email_placeholder`}
              className="rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
            >
              Edit Form Placeholder
            </Link>
            <Link
              href={`/admin/collections/hero/edit/button_text`}
              className="rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
            >
              Edit Button Text
            </Link>
          </div>
        </div>

        {/* Hero preview component */}
        <HeroPreview
          data={fullHeroData}
          activeSection={documentId}
          onEditSection={handleEditSection}
          previewMode={previewMode}
          onPreviewModeChange={setPreviewMode}
        />

        <div className="mt-4 text-sm text-gray-500">
          <p>Click on different sections to navigate to their edit pages.</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-black"
      >
        <h2 className="mb-4 text-xl font-bold capitalize">
          {documentId.replace(/_/g, " ")} Editor
        </h2>

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

        <div className="min-h-[300px]">{renderFormFields()}</div>

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
