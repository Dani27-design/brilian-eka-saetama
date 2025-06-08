"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import ClientsInfoPreview from "./ClientsInfoPreview";
import ImageUploader from "./ImageUploader";

interface ClientsInfoEditorProps {
  collectionName: string;
  documentId: string;
  initialData: any;
  onSubmit: (data: any) => Promise<void>;
  isSaving: boolean;
}

const ClientsInfoEditor = ({
  collectionName,
  documentId,
  initialData,
  onSubmit,
  isSaving,
}: ClientsInfoEditorProps) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<any>(
    initialData || { en: [], id: [] },
  );
  const [fullClientsInfoData, setFullClientsInfoData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>(language || "en");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [clientsBrands, setClientsBrands] = useState<any[]>([]);

  // Load all clients info related data for the preview
  useEffect(() => {
    const fetchClientsInfoData = async () => {
      try {
        const docTypes = ["clients"];
        const data = {};

        for (const docType of docTypes) {
          const docRef = doc(firestore, "clientsInfo", docType);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            data[docType] = docSnap.data();
          }
        }

        // If current document is one of these, use our form data for preview
        if (docTypes.includes(documentId)) {
          data[documentId] = formData;
        }

        setFullClientsInfoData(data);

        // Special handling for clients data
        if (documentId === "clients" && formData && formData[activeTab]) {
          try {
            const brandsData = formData[activeTab];
            setClientsBrands(Array.isArray(brandsData) ? brandsData : []);
          } catch (e) {
            console.error("Failed to process clients brands:", e);
          }
        }
      } catch (error) {
        console.error("Error fetching clients info data:", error);
      }
    };

    fetchClientsInfoData();
  }, [documentId, formData, activeTab]);

  // Make sure formData is properly initialized when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);

      // Special handling for clients data
      if (documentId === "clients" && initialData[activeTab]) {
        try {
          const brandsData = initialData[activeTab];
          setClientsBrands(Array.isArray(brandsData) ? brandsData : []);
        } catch (e) {
          console.error("Failed to process clients brands:", e);
        }
      }
    }
  }, [initialData, documentId, activeTab]);

  // Handle form data change for the entire array
  const handleFormChange = (newBrands: any[]) => {
    setFormData((prev) => ({
      ...prev,
      [activeTab]: newBrands,
    }));
    setClientsBrands(newBrands);
  };

  // Handle individual brand change
  const handleBrandChange = (index: number, field: string, value: any) => {
    const newBrands = [...clientsBrands];
    newBrands[index] = { ...newBrands[index], [field]: value };
    handleFormChange(newBrands);
  };

  // Add new brand
  const addBrand = () => {
    const newBrand = {
      id: Date.now(),
      name: "New Brand",
      href: "#",
      image: "",
      imageLight: "",
    };
    const newBrands = [...clientsBrands, newBrand];
    handleFormChange(newBrands);
  };

  // Remove brand
  const removeBrand = (index: number) => {
    const newBrands = clientsBrands.filter((_, i) => i !== index);
    handleFormChange(newBrands);
  };

  // Move brand up in the list
  const moveBrandUp = (index: number) => {
    if (index === 0) return; // Can't move the first item up
    const newBrands = [...clientsBrands];
    const temp = newBrands[index];
    newBrands[index] = newBrands[index - 1];
    newBrands[index - 1] = temp;
    handleFormChange(newBrands);
  };

  // Move brand down in the list
  const moveBrandDown = (index: number) => {
    if (index === clientsBrands.length - 1) return; // Can't move the last item down
    const newBrands = [...clientsBrands];
    const temp = newBrands[index];
    newBrands[index] = newBrands[index + 1];
    newBrands[index + 1] = temp;
    handleFormChange(newBrands);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Handle which section to edit
  const handleEditSection = (section: string) => {
    if (section !== documentId) {
      window.location.href = `/admin/collections/clientsInfo/edit/${section}`;
    }
  };

  // Render form fields based on the document type
  const renderFormFields = () => {
    switch (documentId) {
      case "clients":
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Client Brands
              </label>
              <p className="mb-4 text-sm text-gray-500">
                Add, edit, or remove client brands below.
              </p>

              {clientsBrands.length === 0 && (
                <div className="mb-4 rounded-md bg-gray-50 p-4 text-center text-gray-500 dark:bg-gray-800">
                  No client brands yet. Add your first brand below.
                </div>
              )}

              {clientsBrands.map((brand, index) => (
                <div
                  key={brand.id || index}
                  className="mb-8 rounded-lg border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-700"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium text-black dark:text-white">
                      #{index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveBrandUp(index)}
                        disabled={index === 0}
                        className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBrandDown(index)}
                        disabled={index === clientsBrands.length - 1}
                        className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBrand(index)}
                        className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        value={brand.name || ""}
                        onChange={(e) =>
                          handleBrandChange(index, "name", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        placeholder="Brand Name"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Link URL
                      </label>
                      <input
                        type="text"
                        value={brand.href || "#"}
                        onChange={(e) =>
                          handleBrandChange(index, "href", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        placeholder="https://example.com"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Use # for no link
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Brand Image (Normal)
                      </label>
                      <ImageUploader
                        value={brand.image || ""}
                        onChange={(url) =>
                          handleBrandChange(index, "image", url)
                        }
                        folder={`clientsInfo/${activeTab}/brands`}
                        aspectRatio="square"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addBrand}
                className="mt-4 w-full rounded-md border border-primary bg-white px-3 py-2 text-sm text-primary hover:bg-primary/5 dark:bg-transparent"
              >
                + Add Brand
              </button>
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
      {/* Clients info preview component */}
      <ClientsInfoPreview
        data={fullClientsInfoData}
        activeSection={documentId}
        onEditSection={handleEditSection}
        previewMode={previewMode}
        onPreviewModeChange={setPreviewMode}
      />

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

        <div className="h-fit">{renderFormFields()}</div>

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

export default ClientsInfoEditor;
