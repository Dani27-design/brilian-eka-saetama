"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import FAQPreview from "./FAQPreview";
import debounce from "lodash/debounce";

interface FAQEditorProps {
  collectionName: string;
  documentId: string;
  initialData: any;
  onSubmit: (data: any) => Promise<void>;
  isSaving: boolean;
}

const FAQEditor = ({
  collectionName,
  documentId,
  initialData,
  onSubmit,
  isSaving,
}: FAQEditorProps) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<any>(
    initialData || { en: "", id: "" },
  );
  const [fullFAQData, setFullFAQData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>(language || "en");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [faqItems, setFaqItems] = useState<any[]>([]);

  // Local state for immediate UI updates during typing
  const [localTextInputs, setLocalTextInputs] = useState({
    title: "",
    subtitle: "",
  });

  // Local state for FAQ items text inputs
  const [localFaqInputs, setLocalFaqInputs] = useState<{
    [key: string]: { question: string; answer: string };
  }>({});

  // Initialize local text inputs when active tab or form data changes
  useEffect(() => {
    if (formData && documentId) {
      if (documentId === "faq_title" && formData[activeTab]) {
        setLocalTextInputs((prev) => ({
          ...prev,
          title: formData[activeTab],
        }));
      }

      if (documentId === "faq_subtitle" && formData[activeTab]) {
        setLocalTextInputs((prev) => ({
          ...prev,
          subtitle: formData[activeTab],
        }));
      }
    }
  }, [activeTab, formData, documentId]);

  // Load all FAQ data once initially - separated from UI updates
  useEffect(() => {
    const fetchFAQData = async () => {
      try {
        const docTypes = ["faq_title", "faq_subtitle", "faq_items"];
        const data = {};

        for (const docType of docTypes) {
          const docRef = doc(firestore, "faq", docType);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            data[docType] = docSnap.data();
          }
        }

        setFullFAQData(data);
      } catch (error) {
        console.error("Error fetching FAQ data:", error);
      }
    };

    fetchFAQData();
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
      setFullFAQData((prevData) => {
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

      // Special handling for FAQ items
      if (documentId === "faq_items" && initialData[activeTab]) {
        try {
          const faqData = initialData[activeTab];
          const items = Array.isArray(faqData) ? faqData : [];
          setFaqItems(items);

          // Initialize local inputs for FAQ items
          const localInputs = {};
          items.forEach((item, index) => {
            localInputs[index] = {
              question: item.question || "",
              answer: item.answer || "",
            };
          });
          setLocalFaqInputs(localInputs);
        } catch (e) {
          console.error("Failed to process FAQ items:", e);
        }
      }
    }
  }, [initialData, documentId, activeTab]);

  // Handle text input changes with local state for responsive UI
  const handleTextInputChange = (e, field) => {
    const value = e.target.value;

    // Update local state immediately for responsive UI
    setLocalTextInputs((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Debounce the update to formData to prevent lag
    debouncedFormUpdate(value);
  };

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

  // Debounced update for text fields
  const debouncedFormUpdate = useCallback(
    debounce((value) => {
      handleFormChange(value);
    }, 500),
    [handleFormChange],
  );

  // Handle FAQ item changes with debouncing for text fields
  const handleFaqItemChange = useCallback(
    (index, field, value) => {
      // Update local state immediately for responsive UI
      if (field === "question" || field === "answer") {
        setLocalFaqInputs((prev) => ({
          ...prev,
          [index]: {
            ...prev[index],
            [field]: value,
          },
        }));
      }

      const newFaqItems = [...faqItems];
      newFaqItems[index] = { ...newFaqItems[index], [field]: value };

      // Update the display state
      setFaqItems(newFaqItems);

      // For text fields, use debounced update to prevent lag
      if (field === "question" || field === "answer") {
        debouncedFaqUpdate(newFaqItems);
      } else {
        handleFormChange(newFaqItems);
      }
    },
    [faqItems],
  );

  // Debounced update for FAQ items
  const debouncedFaqUpdate = useCallback(
    debounce((items) => {
      handleFormChange(items);
    }, 500),
    [handleFormChange],
  );

  // Add a new FAQ item
  const addFaqItem = useCallback(() => {
    const newId =
      faqItems.length > 0
        ? Math.max(...faqItems.map((item) => item.id)) + 1
        : 1;

    const newItem = {
      id: newId,
      question: "New Question",
      answer: "Answer goes here",
    };

    const newFaqItems = [...faqItems, newItem];

    // Add to local inputs too
    setLocalFaqInputs((prev) => ({
      ...prev,
      [faqItems.length]: {
        question: "New Question",
        answer: "Answer goes here",
      },
    }));

    setFaqItems(newFaqItems);
    handleFormChange(newFaqItems);
  }, [faqItems, handleFormChange]);

  // Remove FAQ item
  const removeFaqItem = useCallback(
    (index) => {
      const newFaqItems = faqItems.filter((_, i) => i !== index);

      // Update local inputs - create a new object without the removed FAQ
      const newLocalInputs = { ...localFaqInputs };
      delete newLocalInputs[index];

      // Reindex the keys for local inputs
      const reindexedInputs = {};
      Object.values(newLocalInputs).forEach((value, i) => {
        reindexedInputs[i] = value;
      });

      setLocalFaqInputs(reindexedInputs);
      setFaqItems(newFaqItems);
      handleFormChange(newFaqItems);
    },
    [faqItems, localFaqInputs, handleFormChange],
  );

  // Move FAQ item up - optimized
  const moveFaqItemUp = useCallback(
    (index) => {
      if (index === 0) return; // Can't move the first item up

      const newFaqItems = [...faqItems];
      const temp = newFaqItems[index];
      newFaqItems[index] = newFaqItems[index - 1];
      newFaqItems[index - 1] = temp;

      // Also update local inputs
      const newLocalInputs = { ...localFaqInputs };
      const tempLocal = newLocalInputs[index];
      newLocalInputs[index] = newLocalInputs[index - 1];
      newLocalInputs[index - 1] = tempLocal;

      setLocalFaqInputs(newLocalInputs);
      setFaqItems(newFaqItems);
      handleFormChange(newFaqItems);
    },
    [faqItems, localFaqInputs, handleFormChange],
  );

  // Move FAQ item down - optimized
  const moveFaqItemDown = useCallback(
    (index) => {
      if (index === faqItems.length - 1) return; // Can't move the last item down

      const newFaqItems = [...faqItems];
      const temp = newFaqItems[index];
      newFaqItems[index] = newFaqItems[index + 1];
      newFaqItems[index + 1] = temp;

      // Also update local inputs
      const newLocalInputs = { ...localFaqInputs };
      const tempLocal = newLocalInputs[index];
      newLocalInputs[index] = newLocalInputs[index + 1];
      newLocalInputs[index + 1] = tempLocal;

      setLocalFaqInputs(newLocalInputs);
      setFaqItems(newFaqItems);
      handleFormChange(newFaqItems);
    },
    [faqItems, localFaqInputs, handleFormChange],
  );

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Handle which section to edit
  const handleEditSection = (section: string) => {
    if (section !== documentId) {
      window.location.href = `/admin/collections/faq/edit/${section}`;
    }
  };

  // Render form fields based on the document type
  const renderFormFields = () => {
    switch (documentId) {
      case "faq_title":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                FAQ Section Title
              </label>
              <input
                type="text"
                value={localTextInputs.title || ""}
                onChange={(e) => handleTextInputChange(e, "title")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={
                  activeTab === "en" ? "OUR FAQS" : "TANYA JAWAB KAMI"
                }
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the title that appears above the FAQ section
              </p>
            </div>
          </div>
        );

      case "faq_subtitle":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                FAQ Section Subtitle
              </label>
              <input
                type="text"
                value={localTextInputs.subtitle || ""}
                onChange={(e) => handleTextInputChange(e, "subtitle")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={
                  activeTab === "en"
                    ? "Frequently Asked Questions"
                    : "Pertanyaan yang Sering Diajukan"
                }
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the subtitle text that appears below the main title
              </p>
            </div>
          </div>
        );

      case "faq_items":
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                FAQ Items
              </label>
              <p className="mb-4 text-sm text-gray-500">
                Add, edit, or remove FAQ items below.
              </p>

              {faqItems.length === 0 && (
                <div className="mb-4 rounded-md bg-gray-50 p-4 text-center text-gray-500 dark:bg-gray-800">
                  No FAQ items yet. Add your first question below.
                </div>
              )}

              {faqItems.map((item, index) => (
                <div
                  key={item.id || index}
                  className="mb-8 rounded-lg border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-700"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium text-black dark:text-white">
                      FAQ Item {index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveFaqItemUp(index)}
                        disabled={index === 0}
                        className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFaqItemDown(index)}
                        disabled={index === faqItems.length - 1}
                        className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFaqItem(index)}
                        className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Question
                    </label>
                    <input
                      type="text"
                      value={
                        (localFaqInputs[index] &&
                          localFaqInputs[index].question) ||
                        item.question ||
                        ""
                      }
                      onChange={(e) =>
                        handleFaqItemChange(index, "question", e.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Enter a question"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Answer
                    </label>
                    <textarea
                      value={
                        (localFaqInputs[index] &&
                          localFaqInputs[index].answer) ||
                        item.answer ||
                        ""
                      }
                      onChange={(e) =>
                        handleFaqItemChange(index, "answer", e.target.value)
                      }
                      rows={4}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Enter an answer"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addFaqItem}
                className="mt-4 w-full rounded-md border border-primary bg-white px-3 py-2 text-sm text-primary hover:bg-primary/5 dark:bg-transparent"
              >
                + Add FAQ Item
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
  }, [documentId, activeTab, faqItems, localTextInputs, localFaqInputs]); // Only re-render when these change

  return (
    <div className="space-y-8">
      {/* FAQ preview component - memoized to prevent re-renders during typing */}
      {useMemo(
        () => (
          <FAQPreview
            data={fullFAQData}
            activeSection={documentId}
            onEditSection={handleEditSection}
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
          />
        ),
        [fullFAQData, documentId, previewMode],
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

export default FAQEditor;
