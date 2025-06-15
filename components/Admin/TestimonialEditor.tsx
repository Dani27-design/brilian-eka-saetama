"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import TestimonialPreview from "./TestimonialPreview";
import ImageUploader from "./ImageUploader";
import debounce from "lodash/debounce";

interface TestimonialEditorProps {
  collectionName: string;
  documentId: string;
  initialData: any;
  onSubmit: (data: any) => Promise<void>;
  isSaving: boolean;
}

const TestimonialEditor = ({
  collectionName,
  documentId,
  initialData,
  onSubmit,
  isSaving,
}: TestimonialEditorProps) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<any>(
    initialData || { en: "", id: "" },
  );
  const [fullTestimonialData, setFullTestimonialData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>(language || "en");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [testimonialItems, setTestimonialItems] = useState<any[]>([]);

  // Local state for immediate UI updates during typing
  const [localTextInputs, setLocalTextInputs] = useState({
    title: "",
    subtitle: "",
    description: "",
  });

  // Local state for testimonial items text inputs
  const [localTestimonialInputs, setLocalTestimonialInputs] = useState<{
    [key: string]: { name: string; designation: string; content: string };
  }>({});

  // Initialize local text inputs when active tab or form data changes
  useEffect(() => {
    if (formData && documentId) {
      if (documentId === "testimonial_title" && formData[activeTab]) {
        setLocalTextInputs((prev) => ({
          ...prev,
          title: formData[activeTab],
        }));
      }

      if (documentId === "testimonial_subtitle" && formData[activeTab]) {
        setLocalTextInputs((prev) => ({
          ...prev,
          subtitle: formData[activeTab],
        }));
      }

      if (documentId === "testimonial_description" && formData[activeTab]) {
        setLocalTextInputs((prev) => ({
          ...prev,
          description: formData[activeTab],
        }));
      }
    }
  }, [formData, activeTab, documentId]);

  // Load all testimonial-related data for the preview only once initially
  useEffect(() => {
    const fetchTestimonialData = async () => {
      try {
        const docTypes = [
          "testimonial_title",
          "testimonial_subtitle",
          "testimonial_description",
          "testimonials",
        ];
        const data = {};

        for (const docType of docTypes) {
          const docRef = doc(firestore, "testimonial", docType);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            data[docType] = docSnap.data();
          }
        }

        setFullTestimonialData(data);
      } catch (error) {
        console.error("Error fetching testimonial data:", error);
      }
    };

    fetchTestimonialData();
  }, []); // Only fetch once on component mount

  // Update preview data with debouncing
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
      setFullTestimonialData((prevData) => {
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

      // Special handling for testimonial items
      if (documentId === "testimonials" && initialData[activeTab]) {
        try {
          const testimonialsData = initialData[activeTab];
          const items = Array.isArray(testimonialsData) ? testimonialsData : [];
          setTestimonialItems(items);

          // Initialize local inputs for testimonials
          const localInputs = {};
          items.forEach((item, index) => {
            localInputs[index] = {
              name: item.name || "",
              designation: item.designation || "",
              content: item.content || "",
            };
          });
          setLocalTestimonialInputs(localInputs);
        } catch (e) {
          console.error("Failed to process testimonials:", e);
        }
      }
    }
  }, [initialData, documentId, activeTab]);

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

  // Handle testimonial item changes with debouncing for text fields
  const handleTestimonialChange = useCallback(
    (index, field, value) => {
      // Update local state immediately for responsive UI
      if (field === "name" || field === "designation" || field === "content") {
        setLocalTestimonialInputs((prev) => ({
          ...prev,
          [index]: {
            ...prev[index],
            [field]: value,
          },
        }));
      }

      const newItems = [...testimonialItems];
      newItems[index] = { ...newItems[index], [field]: value };

      // Update the display state
      setTestimonialItems(newItems);

      // For text fields, use debounced update to prevent lag
      if (field === "name" || field === "designation" || field === "content") {
        debouncedTestimonialUpdate(newItems);
      } else {
        // For image uploads, update immediately
        handleFormChange(newItems);
      }
    },
    [testimonialItems],
  );

  // Debounced update for testimonial items
  const debouncedTestimonialUpdate = useCallback(
    debounce((items) => {
      handleFormChange(items);
    }, 500),
    [handleFormChange],
  );

  // Add new testimonial
  const addTestimonial = useCallback(() => {
    const newId =
      testimonialItems.length > 0
        ? Math.max(...testimonialItems.map((item) => Number(item.id || 0))) + 1
        : 1;

    const newTestimonial = {
      id: newId,
      name: "New Client Name",
      designation: "Designation",
      image: "",
      content: "Write client testimonial here...",
      rating: 5,
    };

    const newItems = [...testimonialItems, newTestimonial];

    // Add to local inputs too
    setLocalTestimonialInputs((prev) => ({
      ...prev,
      [testimonialItems.length]: {
        name: "New Client Name",
        designation: "Designation",
        content: "Write client testimonial here...",
      },
    }));

    setTestimonialItems(newItems);
    handleFormChange(newItems);
  }, [testimonialItems, handleFormChange]);

  // Remove testimonial
  const removeTestimonial = useCallback(
    (index) => {
      const newItems = testimonialItems.filter((_, i) => i !== index);

      // Update local inputs - create a new object without the removed testimonial
      const newLocalInputs = { ...localTestimonialInputs };
      delete newLocalInputs[index];

      // Reindex the keys for local inputs
      const reindexedInputs = {};
      Object.values(newLocalInputs).forEach((value, i) => {
        reindexedInputs[i] = value;
      });

      setLocalTestimonialInputs(reindexedInputs);
      setTestimonialItems(newItems);
      handleFormChange(newItems);
    },
    [testimonialItems, localTestimonialInputs, handleFormChange],
  );

  // Move testimonial up
  const moveTestimonialUp = useCallback(
    (index) => {
      if (index === 0) return; // Can't move the first item up

      const newItems = [...testimonialItems];
      const temp = newItems[index];
      newItems[index] = newItems[index - 1];
      newItems[index - 1] = temp;

      // Also update local inputs
      const newLocalInputs = { ...localTestimonialInputs };
      const tempLocal = newLocalInputs[index];
      newLocalInputs[index] = newLocalInputs[index - 1];
      newLocalInputs[index - 1] = tempLocal;

      setLocalTestimonialInputs(newLocalInputs);
      setTestimonialItems(newItems);
      handleFormChange(newItems);
    },
    [testimonialItems, localTestimonialInputs, handleFormChange],
  );

  // Move testimonial down
  const moveTestimonialDown = useCallback(
    (index) => {
      if (index === testimonialItems.length - 1) return; // Can't move the last item down

      const newItems = [...testimonialItems];
      const temp = newItems[index];
      newItems[index] = newItems[index + 1];
      newItems[index + 1] = temp;

      // Also update local inputs
      const newLocalInputs = { ...localTestimonialInputs };
      const tempLocal = newLocalInputs[index];
      newLocalInputs[index] = newLocalInputs[index + 1];
      newLocalInputs[index + 1] = tempLocal;

      setLocalTestimonialInputs(newLocalInputs);
      setTestimonialItems(newItems);
      handleFormChange(newItems);
    },
    [testimonialItems, localTestimonialInputs, handleFormChange],
  );

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Handle which section to edit
  const handleEditSection = (section: string) => {
    if (section !== documentId) {
      window.location.href = `/admin/collections/testimonial/edit/${section}`;
    }
  };

  // Render form fields based on the document type
  const renderFormFields = () => {
    switch (documentId) {
      case "testimonial_title":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Testimonial Section Title
              </label>
              <input
                type="text"
                value={localTextInputs.title || ""}
                onChange={(e) => handleTextInputChange(e, "title")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={activeTab === "en" ? "TESTIMONIALS" : "TESTIMONI"}
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the title that appears above the testimonial section
                (often shown in uppercase)
              </p>
            </div>
          </div>
        );

      case "testimonial_subtitle":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Testimonial Section Subtitle
              </label>
              <input
                type="text"
                value={localTextInputs.subtitle || ""}
                onChange={(e) => handleTextInputChange(e, "subtitle")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={
                  activeTab === "en"
                    ? "Client's Testimonials"
                    : "Testimoni Klien"
                }
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the main subtitle for the testimonial section
              </p>
            </div>
          </div>
        );

      case "testimonial_description":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Testimonial Section Description
              </label>
              <textarea
                value={localTextInputs.description || ""}
                onChange={(e) => handleTextInputChange(e, "description")}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={
                  activeTab === "en"
                    ? "See what our clients say about our services and products."
                    : "Lihat apa yang klien kami katakan tentang layanan dan produk kami."
                }
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter a brief description that appears below the subtitle
              </p>
            </div>
          </div>
        );

      case "testimonials":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Client Testimonials
              </label>
              <p className="mb-4 text-sm text-gray-500">
                Add, edit, or remove client testimonials below
              </p>

              {testimonialItems.length === 0 && (
                <div className="mb-4 rounded-md bg-gray-50 p-4 text-center text-gray-500 dark:bg-gray-800">
                  No testimonials yet. Add your first testimonial below.
                </div>
              )}

              {testimonialItems.map((testimonial, index) => (
                <div
                  key={testimonial.id || index}
                  className="mb-8 rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-600 dark:bg-gray-700"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-medium text-black dark:text-white">
                      #{index + 1}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveTestimonialUp(index)}
                        disabled={index === 0}
                        className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTestimonialDown(index)}
                        disabled={index === testimonialItems.length - 1}
                        className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTestimonial(index)}
                        className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      {/* Client Name */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Client Name
                        </label>
                        <input
                          type="text"
                          value={
                            (localTestimonialInputs[index] &&
                              localTestimonialInputs[index].name) ||
                            testimonial.name ||
                            ""
                          }
                          onChange={(e) =>
                            handleTestimonialChange(
                              index,
                              "name",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      {/* Client designation */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Designation
                        </label>
                        <input
                          type="text"
                          value={
                            (localTestimonialInputs[index] &&
                              localTestimonialInputs[index].designation) ||
                            testimonial.designation ||
                            ""
                          }
                          onChange={(e) =>
                            handleTestimonialChange(
                              index,
                              "designation",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      {/* Client Photo */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Client Photo
                        </label>
                        <ImageUploader
                          value={testimonial.imageUrl || ""}
                          onChange={(url) =>
                            handleTestimonialChange(index, "imageUrl", url)
                          }
                          folder={`testimonial/${activeTab}/clients`}
                          aspectRatio="square"
                        />
                      </div>
                    </div>

                    {/* Testimonial Content */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Testimonial Content
                      </label>
                      <textarea
                        value={
                          (localTestimonialInputs[index] &&
                            localTestimonialInputs[index].content) ||
                          testimonial.content ||
                          ""
                        }
                        onChange={(e) =>
                          handleTestimonialChange(
                            index,
                            "content",
                            e.target.value,
                          )
                        }
                        rows={12}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        placeholder="Write the client's testimonial here..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addTestimonial}
                className="mt-4 w-full rounded-md border border-primary bg-white px-3 py-2 text-sm text-primary hover:bg-primary/5 dark:bg-transparent"
              >
                + Add Testimonial
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
  }, [
    documentId,
    activeTab,
    testimonialItems,
    localTextInputs,
    localTestimonialInputs,
  ]); // Only re-render when these change

  return (
    <div className="space-y-8">
      {/* Testimonial preview component - memoized to prevent re-renders during typing */}
      {useMemo(
        () => (
          <TestimonialPreview
            data={fullTestimonialData}
            activeSection={documentId}
            onEditSection={handleEditSection}
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
          />
        ),
        [fullTestimonialData, documentId, previewMode],
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

export default TestimonialEditor;
