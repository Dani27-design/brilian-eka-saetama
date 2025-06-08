"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import ServicePreview from "./ServicePreview";
import ImageUploader from "./ImageUploader";

interface ServiceEditorProps {
  collectionName: string;
  documentId: string;
  initialData: any;
  onSubmit: (data: any) => Promise<void>;
  isSaving: boolean;
}

const ServiceEditor = ({
  collectionName,
  documentId,
  initialData,
  onSubmit,
  isSaving,
}: ServiceEditorProps) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<any>(
    initialData || { en: "", id: "" },
  );
  const [fullServicesData, setFullServicesData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>(language || "en");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [serviceItems, setServiceItems] = useState<any[]>([]);

  // Load all services-related data for the preview
  useEffect(() => {
    const fetchServicesData = async () => {
      try {
        const docTypes = [
          "services_title",
          "services_subtitle",
          "services_data",
        ];
        const data = {};

        for (const docType of docTypes) {
          const docRef = doc(firestore, "services", docType);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            data[docType] = docSnap.data();
          }
        }

        // If current document is one of these, use our form data for preview
        if (docTypes.includes(documentId)) {
          data[documentId] = formData;
        }

        setFullServicesData(data);

        // Special handling for services data
        if (documentId === "services_data" && formData && formData[activeTab]) {
          try {
            const servicesData = formData[activeTab];
            setServiceItems(Array.isArray(servicesData) ? servicesData : []);
          } catch (e) {
            console.error("Failed to process service items:", e);
          }
        }
      } catch (error) {
        console.error("Error fetching services data:", error);
      }
    };

    fetchServicesData();
  }, [documentId, formData, activeTab]);

  // Make sure formData is properly initialized when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);

      // Special handling for services data
      if (documentId === "services_data" && initialData[activeTab]) {
        try {
          const servicesData = initialData[activeTab];
          setServiceItems(Array.isArray(servicesData) ? servicesData : []);
        } catch (e) {
          console.error("Failed to process service items:", e);
        }
      }
    }
  }, [initialData, documentId, activeTab]);

  // Handle form data change
  const handleFormChange = (value: any) => {
    setFormData((prev) => ({
      ...prev,
      [activeTab]: value,
    }));
  };

  // Handle service item changes
  const handleServiceItemChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    const newServiceItems = [...serviceItems];
    newServiceItems[index] = { ...newServiceItems[index], [field]: value };
    setServiceItems(newServiceItems);
    handleFormChange(newServiceItems);
  };

  const addServiceItem = () => {
    const newItem = {
      title: "New Service",
      description: "Service description goes here",
      image: "",
    };
    const newServiceItems = [...serviceItems, newItem];
    setServiceItems(newServiceItems);
    handleFormChange(newServiceItems);
  };

  const removeServiceItem = (index: number) => {
    const newServiceItems = serviceItems.filter((_, i) => i !== index);
    setServiceItems(newServiceItems);
    handleFormChange(newServiceItems);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Handle which section to edit
  const handleEditSection = (section: string) => {
    if (section !== documentId) {
      window.location.href = `/admin/collections/services/edit/${section}`;
    }
  };

  // Render form fields based on the document type
  const renderFormFields = () => {
    switch (documentId) {
      case "services_title":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Services Section Title
              </label>
              <input
                type="text"
                value={formData[activeTab] || ""}
                onChange={(e) => handleFormChange(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={
                  activeTab === "en" ? "Our Services" : "Layanan Kami"
                }
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the main title for the services section
              </p>
            </div>
          </div>
        );

      case "services_subtitle":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Services Section Subtitle
              </label>
              <textarea
                value={formData[activeTab] || ""}
                onChange={(e) => handleFormChange(e.target.value)}
                className="h-32 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={
                  activeTab === "en"
                    ? "Discover our comprehensive range of services."
                    : "Temukan berbagai layanan komprehensif kami."
                }
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the subtitle or description for the services section
              </p>
            </div>
          </div>
        );

      case "services_data":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Service Items
              </label>
              <p className="mb-4 text-sm text-gray-500">
                Add, edit, or remove service items below.
              </p>

              {serviceItems.length === 0 && (
                <div className="mb-4 rounded-md bg-gray-50 p-4 text-center text-gray-500 dark:bg-gray-800">
                  No service items yet. Add one below.
                </div>
              )}

              {serviceItems.map((item, index) => (
                <div
                  key={index}
                  className="mb-6 rounded-lg border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-700"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium text-black dark:text-white">
                      Service Item {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeServiceItem(index)}
                      className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mb-3">
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Service Title
                    </label>
                    <input
                      type="text"
                      value={item.title || ""}
                      onChange={(e) =>
                        handleServiceItemChange(index, "title", e.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Service Description
                    </label>
                    <textarea
                      value={item.description || ""}
                      onChange={(e) =>
                        handleServiceItemChange(
                          index,
                          "description",
                          e.target.value,
                        )
                      }
                      className="h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Service Image
                    </label>

                    {/* Image Uploader Component */}
                    <ImageUploader
                      value={item.image || ""}
                      onChange={(url) =>
                        handleServiceItemChange(index, "image", url)
                      }
                      folder={`services/${activeTab}`}
                      aspectRatio="landscape"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addServiceItem}
                className="mt-2 w-full rounded-md border border-primary bg-white px-3 py-2 text-sm text-primary hover:bg-primary/5 dark:bg-transparent"
              >
                + Add Service Item
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
      {/* Services preview component */}
      <ServicePreview
        data={fullServicesData}
        activeSection={documentId}
        onEditSection={handleEditSection}
        previewMode={previewMode}
        onPreviewModeChange={setPreviewMode}
      />

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

export default ServiceEditor;
