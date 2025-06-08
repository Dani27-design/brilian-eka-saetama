"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import HeaderPreview from "./HeaderPreview";
import Image from "next/image";
import ImageUploader from "./ImageUploader";

interface HeaderEditorProps {
  collectionName: string;
  documentId: string;
  initialData: any;
  onSubmit: (data: any) => Promise<void>;
  isSaving: boolean;
}

const HeaderEditor = ({
  collectionName,
  documentId,
  initialData,
  onSubmit,
  isSaving,
}: HeaderEditorProps) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [formData, setFormData] = useState<any>(
    initialData || { en: "", id: "" },
  );
  const [fullHeaderData, setFullHeaderData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>(language || "en");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [menuItems, setMenuItems] = useState<any[]>([]);

  // Load all header-related data for the preview
  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const docTypes = ["menu_items", "logo_data", "language_dropdown"];
        const data = {};

        for (const docType of docTypes) {
          const docRef = doc(firestore, "header", docType);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            data[docType] = docSnap.data();
          }
        }

        // If current document is one of these, use our form data for preview
        if (docTypes.includes(documentId)) {
          data[documentId] = formData;
        }

        setFullHeaderData(data);

        // Special handling for menu items
        if (documentId === "menu_items" && formData && formData[activeTab]) {
          try {
            const menuData = formData[activeTab];
            setMenuItems(Array.isArray(menuData) ? menuData : []);
          } catch (e) {
            console.error("Failed to process menu items:", e);
          }
        }
      } catch (error) {
        console.error("Error fetching header data:", error);
      }
    };

    fetchHeaderData();
  }, [documentId, formData, activeTab]);

  // Make sure formData is properly initialized when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);

      // Special handling for menu items
      if (documentId === "menu_items" && initialData[activeTab]) {
        try {
          const menuData = initialData[activeTab];
          setMenuItems(Array.isArray(menuData) ? menuData : []);
        } catch (e) {
          console.error("Failed to process menu items:", e);
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

  // Handle menu item changes
  const handleMenuItemChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    const newMenuItems = [...menuItems];
    newMenuItems[index] = { ...newMenuItems[index], [field]: value };
    setMenuItems(newMenuItems);
    handleFormChange(newMenuItems);
  };

  const addMenuItem = () => {
    const newItem = { title: "New Item", path: "#" };
    const newMenuItems = [...menuItems, newItem];
    setMenuItems(newMenuItems);
    handleFormChange(newMenuItems);
  };

  const addSubmenuItem = (index: number) => {
    const newMenuItems = [...menuItems];
    if (!newMenuItems[index].submenu) {
      newMenuItems[index].submenu = [];
    }
    newMenuItems[index].submenu.push({ title: "New Submenu Item", path: "#" });
    setMenuItems(newMenuItems);
    handleFormChange(newMenuItems);
  };

  const handleSubmenuItemChange = (
    parentIndex: number,
    childIndex: number,
    field: string,
    value: string,
  ) => {
    const newMenuItems = [...menuItems];
    if (
      newMenuItems[parentIndex].submenu &&
      newMenuItems[parentIndex].submenu[childIndex]
    ) {
      newMenuItems[parentIndex].submenu[childIndex][field] = value;
      setMenuItems(newMenuItems);
      handleFormChange(newMenuItems);
    }
  };

  const removeSubmenuItem = (parentIndex: number, childIndex: number) => {
    const newMenuItems = [...menuItems];
    if (newMenuItems[parentIndex].submenu) {
      newMenuItems[parentIndex].submenu = newMenuItems[
        parentIndex
      ].submenu.filter((_, i) => i !== childIndex);
      if (newMenuItems[parentIndex].submenu.length === 0) {
        delete newMenuItems[parentIndex].submenu;
      }
      setMenuItems(newMenuItems);
      handleFormChange(newMenuItems);
    }
  };

  const removeMenuItem = (index: number) => {
    const newMenuItems = menuItems.filter((_, i) => i !== index);
    setMenuItems(newMenuItems);
    handleFormChange(newMenuItems);
  };

  // Handle language dropdown changes
  const handleLanguageDropdownChange = (field: string, value: string) => {
    const currentData = formData[activeTab] || {};
    const updatedData = { ...currentData, [field]: value };
    handleFormChange(updatedData);
  };

  // Handle logo data changes
  const handleLogoDataChange = (field: string, value: string) => {
    const currentData = formData[activeTab] || {};
    const updatedData = { ...currentData, [field]: value };
    handleFormChange(updatedData);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Handle which section to edit
  const handleEditSection = (section: string) => {
    if (section !== documentId) {
      window.location.href = `/admin/collections/header/edit/${section}`;
    }
  };

  // Render form fields based on the document type
  const renderFormFields = () => {
    switch (documentId) {
      case "logo_data":
        const logoData = formData[activeTab] || { light: "", dark: "" };
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Light Mode Logo
              </label>
              <ImageUploader
                value={logoData.light || ""}
                onChange={(url) => handleLogoDataChange("light", url)}
                folder={`logo/light`}
                aspectRatio="square"
              />
              <p className="mt-1 text-sm text-gray-500">
                Upload or select the light mode logo image
              </p>
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Dark Mode Logo
              </label>
              <ImageUploader
                value={logoData.dark || ""}
                onChange={(url) => handleLogoDataChange("dark", url)}
                folder={`logo/dark`}
                aspectRatio="square"
              />
              <p className="mt-1 text-sm text-gray-500">
                Upload or select the dark mode logo image
              </p>
            </div>
          </div>
        );

      case "language_dropdown":
        const langData = formData[activeTab] || { en_text: "", id_text: "" };
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                English Language Display Text
              </label>
              <input
                type="text"
                value={langData.en_text || ""}
                onChange={(e) =>
                  handleLanguageDropdownChange("en_text", e.target.value)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="🇬🇧 English"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the text to display for English option
              </p>
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Indonesian Language Display Text
              </label>
              <input
                type="text"
                value={langData.id_text || ""}
                onChange={(e) =>
                  handleLanguageDropdownChange("id_text", e.target.value)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="🇮🇩 Indonesia"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the text to display for Indonesian option
              </p>
            </div>
          </div>
        );

      case "menu_items":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Menu Items
              </label>
              <p className="mb-4 text-sm text-gray-500">
                Add, edit menu items below. Items with hash (#) paths will be
                treated as anchor links.
              </p>

              {menuItems.length === 0 && (
                <div className="mb-4 rounded-md bg-gray-50 p-4 text-center text-gray-500 dark:bg-gray-800">
                  No menu items yet. Add one below.
                </div>
              )}

              {menuItems.map((item, index) => (
                <div
                  key={index}
                  className="mb-6 rounded-lg border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-700"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium text-black dark:text-white">
                      #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMenuItem(index)}
                      className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Display Title
                      </label>
                      <input
                        type="text"
                        value={item.title || ""}
                        onChange={(e) =>
                          handleMenuItemChange(index, "title", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800"
                      />
                    </div>

                    <div className="cursor-not-allowed">
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Path / URL
                      </label>
                      <input
                        type="text"
                        value={item.path || ""}
                        onChange={(e) =>
                          handleMenuItemChange(index, "path", e.target.value)
                        }
                        disabled={true}
                        className="w-full cursor-not-allowed rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800"
                        placeholder="#section or /page"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addMenuItem}
                className="mt-2 w-full rounded-md border border-primary bg-white px-3 py-2 text-sm text-primary hover:bg-primary/5 dark:bg-transparent"
              >
                + Add Menu Item
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
      {/* Header preview component */}
      <HeaderPreview
        data={fullHeaderData}
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

export default HeaderEditor;
