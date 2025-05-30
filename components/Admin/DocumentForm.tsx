"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import JsonEditor to prevent SSR issues
const JsonEditor = dynamic(() => import("./JsonEditor"), { ssr: false });

interface DocumentFormProps {
  initialData: any;
  onSubmit: (data: any) => Promise<void>;
  isSaving: boolean;
  language: string;
  isCreating?: boolean;
}

export default function DocumentForm({
  initialData,
  onSubmit,
  isSaving,
  language,
  isCreating = false,
}: DocumentFormProps) {
  const [formData, setFormData] = useState<any>(initialData);
  const [documentId, setDocumentId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("en");
  const router = useRouter();

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleSimpleDataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleJsonChange = (lang: string, newData: any) => {
    setFormData((prev) => ({
      ...prev,
      [lang]: newData,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Create a copy of the form data
    const dataToSubmit = { ...formData };

    // If creating a new document and document ID is provided
    if (isCreating && documentId) {
      dataToSubmit.id = documentId;
    }

    await onSubmit(dataToSubmit);
  };

  // Determine if we should show simple inputs or JSON editor
  const isSimpleString =
    (typeof formData.en === "string" && formData.en.length < 1000) ||
    (typeof formData.id === "string" && formData.id.length < 1000);

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-lg border border-stroke bg-white p-6 dark:border-strokedark dark:bg-black">
        {isCreating && (
          <div className="mb-6">
            <label className="mb-2.5 block text-black dark:text-white">
              Document ID (leave empty for auto-generated ID)
            </label>
            <input
              type="text"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              className="w-full rounded border border-stroke bg-white px-4 py-2 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black dark:text-white"
              placeholder="Optional document ID"
            />
          </div>
        )}

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

        {/* Content based on active tab */}
        <div className="mb-6">
          {isSimpleString ? (
            // Simple text input/textarea for string values
            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Content ({activeTab === "en" ? "English" : "Indonesia"})
              </label>
              <textarea
                name={activeTab}
                value={formData[activeTab] || ""}
                onChange={handleSimpleDataChange}
                rows={5}
                className="w-full rounded border border-stroke bg-white px-4 py-2 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black dark:text-white"
              />
            </div>
          ) : (
            // JSON editor for complex data
            <div className="min-h-80">
              <label className="mb-2.5 block text-black dark:text-white">
                JSON Content ({activeTab === "en" ? "English" : "Indonesia"})
              </label>
              <JsonEditor
                value={formData[activeTab] || {}}
                onChange={(newData) => handleJsonChange(activeTab, newData)}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded border border-stroke px-6 py-2 text-black hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-gray-800"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-primary px-6 py-2 text-white hover:bg-opacity-90 disabled:bg-opacity-70"
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="flex items-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <span>{isCreating ? "Create" : "Save Changes"}</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
