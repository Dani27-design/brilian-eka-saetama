"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import AboutPreview from "./AboutPreview";
import ImageUploader from "./ImageUploader";

interface AboutEditorProps {
  collectionName: string;
  documentId: string;
  initialData: any;
  onSubmit: (data: any) => Promise<void>;
  isSaving: boolean;
}

const AboutEditor = ({
  collectionName,
  documentId,
  initialData,
  onSubmit,
  isSaving,
}: AboutEditorProps) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<any>(
    initialData || { en: "", id: "" },
  );
  const [fullAboutData, setFullAboutData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>(language || "en");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [aboutSections, setAboutSections] = useState<any[]>([]);

  // Load all about-related data for the preview
  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const docTypes = ["about_title", "about_subtitle", "about_sections"];
        const data = {};

        for (const docType of docTypes) {
          const docRef = doc(firestore, "about", docType);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            data[docType] = docSnap.data();
          }
        }

        // If current document is one of these, use our form data for preview
        if (docTypes.includes(documentId)) {
          data[documentId] = formData;
        }

        setFullAboutData(data);

        // Special handling for about sections
        if (
          documentId === "about_sections" &&
          formData &&
          formData[activeTab]
        ) {
          try {
            const sectionsData = formData[activeTab];
            setAboutSections(Array.isArray(sectionsData) ? sectionsData : []);
          } catch (e) {
            console.error("Failed to process about sections:", e);
          }
        }
      } catch (error) {
        console.error("Error fetching about data:", error);
      }
    };

    fetchAboutData();
  }, [documentId, formData, activeTab]);

  // Make sure formData is properly initialized when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);

      // Special handling for about sections
      if (documentId === "about_sections" && initialData[activeTab]) {
        try {
          const sectionsData = initialData[activeTab];
          setAboutSections(Array.isArray(sectionsData) ? sectionsData : []);
        } catch (e) {
          console.error("Failed to process about sections:", e);
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

  // Handle about section changes
  const handleSectionChange = (index: number, field: string, value: any) => {
    const newSections = [...aboutSections];
    newSections[index] = { ...newSections[index], [field]: value };
    setAboutSections(newSections);
    handleFormChange(newSections);
  };

  // Handle point changes within a section
  const handlePointChange = (
    sectionIndex: number,
    pointIndex: number,
    field: string,
    value: any,
  ) => {
    const newSections = [...aboutSections];
    if (!newSections[sectionIndex].points) {
      newSections[sectionIndex].points = [];
    }
    if (!newSections[sectionIndex].points[pointIndex]) {
      newSections[sectionIndex].points[pointIndex] = {
        id: Date.now().toString(),
      };
    }

    newSections[sectionIndex].points[pointIndex] = {
      ...newSections[sectionIndex].points[pointIndex],
      [field]: value,
    };

    setAboutSections(newSections);
    handleFormChange(newSections);
  };

  const addSection = () => {
    const newSection = {
      id: Date.now().toString(),
      title: "New Section",
      subtitle: "Section Subtitle",
      lightImage: "",
      darkImage: "",
      description: "Section description goes here",
      points: [],
    };
    const newSections = [...aboutSections, newSection];
    setAboutSections(newSections);
    handleFormChange(newSections);
  };

  const removeSection = (index: number) => {
    const newSections = aboutSections.filter((_, i) => i !== index);
    setAboutSections(newSections);
    handleFormChange(newSections);
  };

  const addPoint = (sectionIndex: number) => {
    const newSections = [...aboutSections];
    if (!newSections[sectionIndex].points) {
      newSections[sectionIndex].points = [];
    }

    const newPoint = {
      id: Date.now().toString(),
      number: (newSections[sectionIndex].points.length + 1).toString(),
      title: "New Point",
      description: "Point description goes here",
    };

    newSections[sectionIndex].points.push(newPoint);
    setAboutSections(newSections);
    handleFormChange(newSections);
  };

  const removePoint = (sectionIndex: number, pointIndex: number) => {
    const newSections = [...aboutSections];
    if (newSections[sectionIndex].points) {
      newSections[sectionIndex].points = newSections[
        sectionIndex
      ].points.filter((_, i) => i !== pointIndex);
    }
    setAboutSections(newSections);
    handleFormChange(newSections);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Handle which section to edit
  const handleEditSection = (section: string) => {
    if (section !== documentId) {
      window.location.href = `/admin/collections/about/edit/${section}`;
    }
  };

  // Render form fields based on the document type
  const renderFormFields = () => {
    switch (documentId) {
      case "about_title":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                About Section Title
              </label>
              <input
                type="text"
                value={formData[activeTab] || ""}
                onChange={(e) => handleFormChange(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={activeTab === "en" ? "About Us" : "Tentang Kami"}
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the main title for the about section
              </p>
            </div>
          </div>
        );

      case "about_subtitle":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                About Section Subtitle
              </label>
              <textarea
                value={formData[activeTab] || ""}
                onChange={(e) => handleFormChange(e.target.value)}
                className="h-32 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={
                  activeTab === "en"
                    ? "Learn more about our company."
                    : "Pelajari lebih lanjut tentang perusahaan kami."
                }
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the subtitle or description for the about section
              </p>
            </div>
          </div>
        );

      case "about_sections":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                About Sections
              </label>
              <p className="mb-4 text-sm text-gray-500">
                Add, edit, or remove about sections below.
              </p>

              {aboutSections.length === 0 && (
                <div className="mb-4 rounded-md bg-gray-50 p-4 text-center text-gray-500 dark:bg-gray-800">
                  No about sections yet. Add one below.
                </div>
              )}

              {aboutSections.map((section, index) => (
                <div
                  key={index}
                  className="mb-8 rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-600 dark:bg-gray-700"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-medium text-black dark:text-white">
                      Section {index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeSection(index)}
                      className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                    >
                      Remove Section
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Section Title */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Section Title
                      </label>
                      <input
                        type="text"
                        value={section.title || ""}
                        onChange={(e) =>
                          handleSectionChange(index, "title", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    {/* Section Subtitle */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Section Subtitle
                      </label>
                      <input
                        type="text"
                        value={section.subtitle || ""}
                        onChange={(e) =>
                          handleSectionChange(index, "subtitle", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    {/* Section Description */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Section Description
                      </label>
                      <textarea
                        value={section.description || ""}
                        onChange={(e) =>
                          handleSectionChange(
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                        className="h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    {/* Section Images - Light and Dark Mode */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* Light Mode Image */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Light Mode Image
                        </label>
                        <ImageUploader
                          value={section.lightImage || ""}
                          onChange={(url) =>
                            handleSectionChange(index, "lightImage", url)
                          }
                          folder={`about/${activeTab}/light`}
                          aspectRatio="square"
                        />
                      </div>

                      {/* Dark Mode Image */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Dark Mode Image
                        </label>
                        <ImageUploader
                          value={section.darkImage || ""}
                          onChange={(url) =>
                            handleSectionChange(index, "darkImage", url)
                          }
                          folder={`about/${activeTab}/dark`}
                          aspectRatio="square"
                        />
                      </div>
                    </div>

                    {/* Points (Optional) */}
                    <div className="pt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Points (Optional)
                        </label>
                        <button
                          type="button"
                          onClick={() => addPoint(index)}
                          className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300"
                        >
                          + Add Point
                        </button>
                      </div>

                      {section.points && section.points.length > 0 ? (
                        <div className="space-y-4">
                          {section.points.map((point, pointIndex) => (
                            <div
                              key={point.id || pointIndex}
                              className="rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-medium">
                                  Point {pointIndex + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removePoint(index, pointIndex)}
                                  className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                                >
                                  Remove
                                </button>
                              </div>

                              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                <div>
                                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                                    Number
                                  </label>
                                  <input
                                    type="text"
                                    value={point.number || ""}
                                    onChange={(e) =>
                                      handlePointChange(
                                        index,
                                        pointIndex,
                                        "number",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                                    Title
                                  </label>
                                  <input
                                    type="text"
                                    value={point.title || ""}
                                    onChange={(e) =>
                                      handlePointChange(
                                        index,
                                        pointIndex,
                                        "title",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                  />
                                </div>
                              </div>
                              <div className="mt-2">
                                <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                                  Description
                                </label>
                                <textarea
                                  value={point.description || ""}
                                  onChange={(e) =>
                                    handlePointChange(
                                      index,
                                      pointIndex,
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                  rows={2}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-md bg-gray-50 p-4 text-center text-xs text-gray-500 dark:bg-gray-800">
                          No points added. Click "Add Point" to add numbered
                          points to this section.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addSection}
                className="mt-4 w-full rounded-md border border-primary bg-white px-3 py-2 text-sm text-primary hover:bg-primary/5 dark:bg-transparent"
              >
                + Add Section
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
      {/* About preview component */}
      <AboutPreview
        data={fullAboutData}
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

export default AboutEditor;
