"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import HeaderPreview from "./HeaderPreview";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import CollectionHeader from "./CollectionHeader";
import Link from "next/link";

interface MenuItem {
  title: string;
  path?: string;
  submenu?: MenuItem[];
}

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
  const [formData, setFormData] = useState<any>(initialData);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [fullHeaderData, setFullHeaderData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>("en");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newMenuItem, setNewMenuItem] = useState<MenuItem>({
    title: "",
    path: "",
  });

  // Load all header related data for the preview
  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        // Build complete header data from all documents
        const docTypes = [
          "menu_items",
          "language_dropdown",
          "logo_dark",
          "logo_light",
        ];
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

        // Initialize menu items if we're editing menu_items
        if (documentId === "menu_items" && formData && formData[activeTab]) {
          setMenuItems(formData[activeTab] || []);
        }
      } catch (error) {
        console.error("Error fetching header data:", error);
      }
    };

    fetchHeaderData();
  }, [documentId, formData, activeTab]);

  // Handle form data change - corrected for proper logo structure
  const handleFormChange = (field: string, value: any) => {
    if (documentId === "menu_items" && field === "") {
      // Special case for menu items - replace the entire array
      setFormData((prev) => ({
        ...prev,
        [activeTab]: value, // Directly set the array as the value
      }));
    } else if (documentId === "logo_dark" || documentId === "logo_light") {
      // For logos, we're storing the URL directly under the language key
      setFormData((prev) => ({
        ...prev,
        [activeTab]: value, // Store URL string directly under language key
      }));
    } else {
      // Normal case for other fields - update a specific field
      setFormData((prev) => ({
        ...prev,
        [activeTab]: {
          ...(prev[activeTab] || {}),
          [field]: value,
        },
      }));
    }
  };

  // Handle specific type of inputs based on documentId
  const renderFormFields = () => {
    switch (documentId) {
      case "logo_dark":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Dark Logo URL (shown in dark mode)
              </label>
              <input
                type="text"
                value={formData[activeTab] || ""}
                onChange={(e) => handleFormChange("", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="/images/logo/logo-dark.png"
              />
              {formData[activeTab] && (
                <div className="mt-2 rounded border bg-gray-50 p-2 dark:bg-gray-800">
                  <p className="mb-2 text-xs text-gray-500">Logo Preview:</p>
                  <img
                    src={formData[activeTab]}
                    alt="Dark Logo Preview"
                    className="h-10 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/images/logo/logo-dark.png";
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case "logo_light":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Light Logo URL (shown in light mode)
              </label>
              <input
                type="text"
                value={formData[activeTab] || ""}
                onChange={(e) => handleFormChange("", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="/images/logo/logo-light.png"
              />
              {formData[activeTab] && (
                <div className="mt-2 rounded border bg-gray-50 p-2 dark:bg-gray-800">
                  <p className="mb-2 text-xs text-gray-500">Logo Preview:</p>
                  <img
                    src={formData[activeTab]}
                    alt="Light Logo Preview"
                    className="h-10 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/images/logo/logo-light.png";
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case "language_dropdown":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                English Text Label
              </label>
              <input
                type="text"
                value={formData[activeTab]?.en_text || ""}
                onChange={(e) => handleFormChange("en_text", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="🇬🇧 English"
              />
            </div>
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Indonesian Text Label
              </label>
              <input
                type="text"
                value={formData[activeTab]?.id_text || ""}
                onChange={(e) => handleFormChange("id_text", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="🇮🇩 Indonesia"
              />
            </div>
          </div>
        );

      case "menu_items":
        return (
          <div className="space-y-6">
            <div className="rounded-md border p-4">
              <h3 className="mb-4 text-lg font-medium">Menu Items</h3>

              {menuItems?.length > 0 &&
                menuItems?.map((item, index) => (
                  <div
                    key={index}
                    className="mb-4 rounded-md border bg-gray-50 p-4 dark:bg-gray-800"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-medium">Menu Item #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = [...menuItems];
                          newItems.splice(index, 1);
                          setMenuItems(newItems);
                          handleFormChange("", newItems); // Update the entire array
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Title
                        </label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const newItems = [...menuItems];
                            newItems[index].title = e.target.value;
                            setMenuItems(newItems);
                            handleFormChange("", newItems);
                          }}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Path
                        </label>
                        <input
                          type="text"
                          value={item.path || ""}
                          onChange={(e) => {
                            const newItems = [...menuItems];
                            newItems[index].path = e.target.value;
                            setMenuItems(newItems);
                            handleFormChange("", newItems);
                          }}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="#section or /page-path"
                        />
                      </div>
                    </div>

                    {/* Submenu toggle - simplified for this example */}
                    <div className="mt-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={!!item.submenu && item.submenu.length > 0}
                          onChange={(e) => {
                            const newItems = [...menuItems];
                            newItems[index].submenu = e.target.checked
                              ? []
                              : undefined;
                            setMenuItems(newItems);
                            handleFormChange("", newItems);
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">Has Submenu</span>
                      </label>
                    </div>
                  </div>
                ))}

              {/* Add new menu item */}
              {/* <div className="mt-4 rounded-md border border-dashed p-4">
                <h4 className="mb-2 font-medium">Add New Menu Item</h4>
                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newMenuItem.title}
                      onChange={(e) =>
                        setNewMenuItem({
                          ...newMenuItem,
                          title: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="About"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Path
                    </label>
                    <input
                      type="text"
                      value={newMenuItem.path || ""}
                      onChange={(e) =>
                        setNewMenuItem({ ...newMenuItem, path: e.target.value })
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="#about or /about"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (newMenuItem.title) {
                      const newItems = [...menuItems, { ...newMenuItem }];
                      setMenuItems(newItems);
                      handleFormChange("", newItems);
                      setNewMenuItem({ title: "", path: "" });
                    }
                  }}
                  disabled={!newMenuItem.title}
                  className="rounded-md bg-primary px-4 py-2 text-white disabled:opacity-50"
                >
                  Add Item
                </button>
              </div> */}
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

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-black">
        {/* <h2 className="mb-4 text-xl font-bold">Header Preview</h2> */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-black dark:text-white">
            Header Preview
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/collections/header/edit/menu_items`}
              className="rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
            >
              Edit Menu Items
            </Link>
            <Link
              href={`/admin/collections/header/edit/logo_dark`}
              className="rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
            >
              Edit Dark Logo
            </Link>
            <Link
              href={`/admin/collections/header/edit/logo_light`}
              className="rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
            >
              Edit Light Logo
            </Link>
            <Link
              href={`/admin/collections/header/edit/language_dropdown`}
              className="rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
            >
              Edit Language
            </Link>
          </div>
        </div>

        {/* Header preview component */}
        <HeaderPreview
          data={fullHeaderData}
          activeSection={
            documentId as
              | "menu_items"
              | "logo_dark"
              | "logo_light"
              | "language_dropdown"
          }
          onEditSection={handleEditSection}
          previewMode={previewMode}
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
          {documentId.replace("_", " ")} Editor
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

export default HeaderEditor;
