"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import ClientsPreview from "./ClientsPreview";
import ImageUploader from "./ImageUploader";
import debounce from "lodash/debounce";

interface ClientsEditorProps {
  collectionName: string;
  documentId: string;
  initialData: any;
  onSubmit: (data: any) => Promise<void>;
  isSaving: boolean;
}

const ClientsEditor = ({
  collectionName,
  documentId,
  initialData,
  onSubmit,
  isSaving,
}: ClientsEditorProps) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<any>(
    initialData || { en: "", id: "" },
  );
  const [fullClientsData, setFullClientsData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>(language || "en");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [clientsStats, setClientsStats] = useState<any[]>([]);

  // Local state for immediate UI updates during typing
  const [localTextInputs, setLocalTextInputs] = useState({
    title: "",
    description: "",
  });

  // Local state for stats items text inputs
  const [localStatsInputs, setLocalStatsInputs] = useState<{
    [key: string]: { value: string; label: string };
  }>({});

  // Initialize local text inputs when active tab or form data changes
  useEffect(() => {
    if (formData && documentId === "clients_data" && formData[activeTab]) {
      const currentData = formData[activeTab] || {};
      setLocalTextInputs({
        title: currentData.title || "",
        description: currentData.description || "",
      });

      // Initialize stats local inputs
      if (currentData.stats && Array.isArray(currentData.stats)) {
        const statsInputs = {};
        currentData.stats.forEach((stat, index) => {
          statsInputs[index] = {
            value: stat.value || "",
            label: stat.label || "",
          };
        });
        setLocalStatsInputs(statsInputs);
      }
    }
  }, [activeTab, formData, documentId]);

  // Load all clients-related data for the preview only once initially
  useEffect(() => {
    const fetchClientsData = async () => {
      try {
        const docTypes = ["clients_data", "clients_background"];
        const data = {};

        for (const docType of docTypes) {
          const docRef = doc(firestore, "clients", docType);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            data[docType] = docSnap.data();
          }
        }

        setFullClientsData(data);

        // Special handling for clients data
        if (documentId === "clients_data" && formData && formData[activeTab]) {
          try {
            const currentData = formData[activeTab] || {};
            if (currentData.stats && Array.isArray(currentData.stats)) {
              setClientsStats(currentData.stats);
            } else {
              setClientsStats([]);
            }
          } catch (e) {
            console.error("Failed to process clients stats:", e);
          }
        }
      } catch (error) {
        console.error("Error fetching clients data:", error);
      }
    };

    fetchClientsData();
  }, []); // Only fetch once on component mount

  // Update preview data - optimized with debouncing
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
      setFullClientsData((prevData) => {
        // Create a deep copy of the previous state
        const updatedData = JSON.parse(JSON.stringify(prevData || {}));

        // Only update the current document, preserving other data
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
      if (documentId === "clients_data" && initialData[activeTab]) {
        try {
          const currentData = initialData[activeTab] || {};
          if (currentData.stats && Array.isArray(currentData.stats)) {
            setClientsStats(currentData.stats);
          } else {
            setClientsStats([]);
          }
        } catch (e) {
          console.error("Failed to process clients stats:", e);
        }
      }
    }
  }, [initialData, documentId, activeTab]);

  // Optimized form change handler
  const handleFormChange = useCallback(
    (field, value) => {
      setFormData((prev) => {
        const currentData = prev[activeTab] || {};
        return {
          ...prev,
          [activeTab]: {
            ...currentData,
            [field]: value,
          },
        };
      });
    },
    [activeTab],
  );

  // Debounced update for text fields
  const debouncedTextUpdate = useCallback(
    debounce((field, value) => {
      handleFormChange(field, value);
    }, 500),
    [handleFormChange],
  );

  // Handle text input changes with local state for responsive UI
  const handleTextInputChange = (e, field) => {
    const value = e.target.value;

    // Update local state immediately for responsive UI
    setLocalTextInputs((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Debounce the update to formData to prevent lag
    debouncedTextUpdate(field, value);
  };

  // Handle form data change for clients stats
  const handleStatsChange = useCallback(
    (newStats) => {
      const currentData = formData[activeTab] || {};
      setFormData((prev) => ({
        ...prev,
        [activeTab]: {
          ...currentData,
          stats: newStats,
        },
      }));
      setClientsStats(newStats);
    },
    [activeTab, formData],
  );

  // Debounced update for stats
  const debouncedStatsUpdate = useCallback(
    debounce((newStats) => {
      handleStatsChange(newStats);
    }, 500),
    [handleStatsChange],
  );

  // Handle individual stat change with local state for immediate feedback
  const handleStatChange = (index, field, value) => {
    // Update local state immediately for responsive UI
    setLocalStatsInputs((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value,
      },
    }));

    // Also update the display list for other UI elements
    const newStats = [...clientsStats];
    newStats[index] = { ...newStats[index], [field]: value };
    setClientsStats(newStats);

    // For text fields, use debounced update to prevent lag
    if (["value", "label"].includes(field)) {
      debouncedStatsUpdate(newStats);
    } else {
      handleStatsChange(newStats);
    }
  };

  // Add new stat
  const addStat = () => {
    const newStat = {
      id: Date.now(),
      value: "100+",
      label: "New Stat",
    };
    const newStats = [...clientsStats, newStat];
    setClientsStats(newStats);

    // Also add to local inputs for immediate feedback
    setLocalStatsInputs((prev) => ({
      ...prev,
      [clientsStats.length]: {
        value: "100+",
        label: "New Stat",
      },
    }));

    handleStatsChange(newStats);
  };

  // Remove stat
  const removeStat = (index) => {
    const newStats = clientsStats.filter((_, i) => i !== index);

    // Update both states
    setClientsStats(newStats);

    // Create a new object without the removed stat
    const newLocalInputs = { ...localStatsInputs };
    delete newLocalInputs[index];

    // Reindex the keys
    const reindexedInputs = {};
    Object.values(newLocalInputs).forEach((value, i) => {
      reindexedInputs[i] = value;
    });

    setLocalStatsInputs(reindexedInputs);
    handleStatsChange(newStats);
  };

  // Handle background image changes
  const handleBackgroundChange = useCallback(
    (field, value) => {
      setFormData((prev) => {
        const currentData = prev[activeTab] || {};
        return {
          ...prev,
          [activeTab]: {
            ...currentData,
            [field]: value,
          },
        };
      });
    },
    [activeTab],
  );

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Handle which section to edit
  const handleEditSection = (section) => {
    if (section !== documentId) {
      window.location.href = `/admin/collections/clients/edit/${section}`;
    }
  };

  // Render form fields based on the document type
  const renderFormFields = () => {
    switch (documentId) {
      case "clients_data":
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Clients Section Title
              </label>
              <input
                type="text"
                value={localTextInputs.title}
                onChange={(e) => handleTextInputChange(e, "title")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={
                  activeTab === "en"
                    ? "Trusted by Global Companies"
                    : "Dipercaya oleh Perusahaan Global"
                }
              />
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Clients Section Description
              </label>
              <textarea
                value={localTextInputs.description}
                onChange={(e) => handleTextInputChange(e, "description")}
                className="h-24 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={
                  activeTab === "en"
                    ? "Our company has been delivering high-quality services to clients worldwide."
                    : "Perusahaan kami telah memberikan layanan berkualitas tinggi kepada klien di seluruh dunia."
                }
              />
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Client Stats
              </label>
              <p className="mb-4 text-sm text-gray-500">
                Add, edit, or remove statistics that show your company's
                achievements
              </p>

              {clientsStats.length === 0 && (
                <div className="mb-4 rounded-md bg-gray-50 p-4 text-center text-gray-500 dark:bg-gray-800">
                  No stats yet. Add your first statistic below.
                </div>
              )}

              {clientsStats.map((stat, index) => (
                <div
                  key={stat.id || index}
                  className="mb-4 rounded-lg border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-700"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium text-black dark:text-white">
                      Stat {index + 1}
                    </span>
                    {/* <button
                      type="button"
                      onClick={() => removeStat(index)}
                      className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                    >
                      Remove
                    </button> */}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Value (e.g. 100+, 24/7)
                      </label>
                      <input
                        type="text"
                        value={
                          (localStatsInputs[index] &&
                            localStatsInputs[index].value) ||
                          stat.value ||
                          ""
                        }
                        onChange={(e) =>
                          handleStatChange(index, "value", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Label
                      </label>
                      <input
                        type="text"
                        value={
                          (localStatsInputs[index] &&
                            localStatsInputs[index].label) ||
                          stat.label ||
                          ""
                        }
                        onChange={(e) =>
                          handleStatChange(index, "label", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "clients_background":
        const bgData = formData[activeTab] || { light: "", dark: "" };
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Light Mode Background Image
              </label>
              <ImageUploader
                value={bgData.light || ""}
                onChange={(url) => handleBackgroundChange("light", url)}
                folder={`clients/${activeTab}/light`}
                aspectRatio="portrait"
              />
              <p className="mt-1 text-sm text-gray-500">
                Upload or select a background image for light mode
              </p>
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Dark Mode Background Image
              </label>
              <ImageUploader
                value={bgData.dark || ""}
                onChange={(url) => handleBackgroundChange("dark", url)}
                folder={`clients/${activeTab}/dark`}
                aspectRatio="portrait"
              />
              <p className="mt-1 text-sm text-gray-500">
                Upload or select a background image for dark mode
              </p>
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
  }, [documentId, activeTab, clientsStats, localTextInputs, localStatsInputs]); // Only re-render when these change

  return (
    <div className="space-y-8">
      {/* Clients preview component - memoized to prevent re-renders during typing */}
      {useMemo(
        () => (
          <ClientsPreview
            data={fullClientsData}
            activeSection={documentId}
            onEditSection={handleEditSection}
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
          />
        ),
        [fullClientsData, documentId, previewMode],
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

export default ClientsEditor;
