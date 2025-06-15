"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import ClientsInfoPreview from "./ClientsInfoPreview";
import ImageUploader from "./ImageUploader";
import debounce from "lodash/debounce";

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
  const [activeTab, setActiveTab] = useState<string>(language || "id");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [clientsBrands, setClientsBrands] = useState<any[]>([]);

  // Local state for immediate UI updates during typing
  const [localBrandInputs, setLocalBrandInputs] = useState<{
    [key: string]: { name: string; href: string };
  }>({});

  // Load all clients info related data for the preview only once initially
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

        setFullClientsInfoData(data);
      } catch (error) {
        console.error("Error fetching clients info data:", error);
      }
    };

    fetchClientsInfoData();
  }, []); // Only fetch once on component mount

  // Update the preview data with debouncing
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
      setFullClientsInfoData((prevData) => {
        // Create a deep copy of previous state
        const updatedData = JSON.parse(JSON.stringify(prevData || {}));

        // Only update the current document
        if (documentId) {
          updatedData[documentId] = formData;
        }

        return updatedData;
      });
    }, 500); // Longer delay for preview updates

    return () => clearTimeout(updateTimer);
  }, [formData, documentId]);

  // Make sure formData is properly initialized when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);

      // Special handling for clients data
      if (documentId === "clients" && initialData[activeTab]) {
        try {
          const brandsData = initialData[activeTab];
          const brands = Array.isArray(brandsData) ? brandsData : [];
          setClientsBrands(brands);

          // Initialize local inputs for brands
          const localInputs = {};
          brands.forEach((brand, index) => {
            localInputs[index] = {
              name: brand.name || "",
              href: brand.href || "#",
            };
          });
          setLocalBrandInputs(localInputs);
        } catch (e) {
          console.error("Failed to process clients brands:", e);
        }
      }
    }
  }, [initialData, documentId, activeTab]);

  // Handle form data change for the entire array - optimized with useCallback
  const handleFormChange = useCallback(
    (newBrands: any[]) => {
      setFormData((prev) => ({
        ...prev,
        [activeTab]: newBrands,
      }));
      setClientsBrands(newBrands);
    },
    [activeTab],
  );

  // Debounced update for text fields
  const debouncedBrandUpdate = useCallback(
    debounce((newBrands) => {
      handleFormChange(newBrands);
    }, 500),
    [handleFormChange],
  );

  // Handle individual brand change with debouncing for text fields
  const handleBrandChange = (index: number, field: string, value: any) => {
    // Update the local state immediately for responsive UI
    if (field === "name" || field === "href") {
      setLocalBrandInputs((prev) => ({
        ...prev,
        [index]: {
          ...prev[index],
          [field]: value,
        },
      }));
    }

    const newBrands = [...clientsBrands];
    newBrands[index] = { ...newBrands[index], [field]: value };

    // Update the display state
    setClientsBrands(newBrands);

    // For text fields, use debounced update to prevent lag
    if (field === "name" || field === "href") {
      debouncedBrandUpdate(newBrands);
    } else {
      // For image uploads or other non-text fields, update immediately
      handleFormChange(newBrands);
    }
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

    // Add to local inputs too
    setLocalBrandInputs((prev) => ({
      ...prev,
      [clientsBrands.length]: {
        name: "New Brand",
        href: "#",
      },
    }));

    handleFormChange(newBrands);
  };

  // Remove brand
  const removeBrand = (index: number) => {
    const newBrands = clientsBrands.filter((_, i) => i !== index);

    // Update local inputs - create a new object without the removed brand
    const newLocalInputs = { ...localBrandInputs };
    delete newLocalInputs[index];

    // Reindex the keys for local inputs
    const reindexedInputs = {};
    Object.values(newLocalInputs).forEach((value, i) => {
      reindexedInputs[i] = value;
    });

    setLocalBrandInputs(reindexedInputs);
    handleFormChange(newBrands);
  };

  // Move brand up in the list
  const moveBrandUp = (index: number) => {
    if (index === 0) return; // Can't move the first item up
    const newBrands = [...clientsBrands];
    const temp = newBrands[index];
    newBrands[index] = newBrands[index - 1];
    newBrands[index - 1] = temp;

    // Also update local inputs
    const newLocalInputs = { ...localBrandInputs };
    const tempLocal = newLocalInputs[index];
    newLocalInputs[index] = newLocalInputs[index - 1];
    newLocalInputs[index - 1] = tempLocal;

    setLocalBrandInputs(newLocalInputs);
    handleFormChange(newBrands);
  };

  // Move brand down in the list
  const moveBrandDown = (index: number) => {
    if (index === clientsBrands.length - 1) return; // Can't move the last item down
    const newBrands = [...clientsBrands];
    const temp = newBrands[index];
    newBrands[index] = newBrands[index + 1];
    newBrands[index + 1] = temp;

    // Also update local inputs
    const newLocalInputs = { ...localBrandInputs };
    const tempLocal = newLocalInputs[index];
    newLocalInputs[index] = newLocalInputs[index + 1];
    newLocalInputs[index + 1] = tempLocal;

    setLocalBrandInputs(newLocalInputs);
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
                        value={
                          (localBrandInputs[index] &&
                            localBrandInputs[index].name) ||
                          brand.name ||
                          ""
                        }
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
                        value={
                          (localBrandInputs[index] &&
                            localBrandInputs[index].href) ||
                          brand.href ||
                          "#"
                        }
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

  // Memoize the form fields to prevent unnecessary re-renders
  const memoizedFormFields = useMemo(() => {
    return renderFormFields();
  }, [documentId, activeTab, clientsBrands, localBrandInputs]); // Only re-render when these change

  return (
    <div className="space-y-8">
      {/* Clients info preview component - memoized to prevent re-renders during typing */}
      {useMemo(
        () => (
          <ClientsInfoPreview
            data={fullClientsInfoData}
            activeSection={documentId}
            onEditSection={handleEditSection}
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
          />
        ),
        [fullClientsInfoData, documentId, previewMode],
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

export default ClientsInfoEditor;
