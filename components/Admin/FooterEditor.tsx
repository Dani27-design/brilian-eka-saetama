"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import FooterPreview from "./FooterPreview";
import { Footer } from "@/types/footer";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";

interface FooterEditorProps {
  collectionName: string;
  documentId: string;
  initialData: any;
  onSubmit: (data: any) => Promise<void>;
  isSaving: boolean;
}

const FooterEditor = ({
  collectionName,
  documentId,
  initialData,
  onSubmit,
  isSaving,
}: FooterEditorProps) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<any>(
    initialData || { en: {}, id: {} },
  );
  const [fullFooterData, setFullFooterData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>(language || "en");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );

  // Load footer data for the preview
  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const docRef = doc(firestore, "footer", "main");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { main: docSnap.data() };

          // If current document is one of these, use our form data for preview
          if (documentId === "main") {
            data.main = formData;
          }

          setFullFooterData(data);
        }
      } catch (error) {
        console.error("Error fetching footer data:", error);
      }
    };

    fetchFooterData();
  }, [documentId, formData]);

  // Make sure formData is properly initialized when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Handle form data change for simple fields
  const handleFormChange = (section: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [section]: {
          ...prev[activeTab]?.[section],
          [field]: value,
        },
      },
    }));
  };

  // Handle form data change for nested fields
  const handleNestedFormChange = (
    section: string,
    subSection: string,
    field: string,
    value: any,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [section]: {
          ...prev[activeTab]?.[section],
          [subSection]: {
            ...prev[activeTab]?.[section]?.[subSection],
            [field]: value,
          },
        },
      },
    }));
  };

  // Handle link change
  const handleLinkChange = (
    section: string,
    index: number,
    field: string,
    value: string,
  ) => {
    const newLinks = [...(formData[activeTab]?.[section]?.links || [])];
    newLinks[index] = {
      ...newLinks[index],
      [field]: value,
    };

    setFormData((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [section]: {
          ...prev[activeTab]?.[section],
          links: newLinks,
        },
      },
    }));
  };

  // Add a new link
  const handleAddLink = (section: string) => {
    const newLinks = [
      ...(formData[activeTab]?.[section]?.links || []),
      { name: "", url: "" },
    ];

    setFormData((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [section]: {
          ...prev[activeTab]?.[section],
          links: newLinks,
        },
      },
    }));
  };

  // Remove a link
  const handleRemoveLink = (section: string, index: number) => {
    const newLinks = [...(formData[activeTab]?.[section]?.links || [])];
    newLinks.splice(index, 1);

    setFormData((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [section]: {
          ...prev[activeTab]?.[section],
          links: newLinks,
        },
      },
    }));
  };

  // Handle social media change
  const handleSocialMediaChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    const newSocialMedia = [
      ...(formData[activeTab]?.bottom?.social_media || []),
    ];
    newSocialMedia[index] = {
      ...newSocialMedia[index],
      [field]: value,
    };

    setFormData((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        bottom: {
          ...prev[activeTab]?.bottom,
          social_media: newSocialMedia,
        },
      },
    }));
  };

  // Add a new social media
  const handleAddSocialMedia = () => {
    const newSocialMedia = [
      ...(formData[activeTab]?.bottom?.social_media || []),
      { name: "", url: "" },
    ];

    setFormData((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        bottom: {
          ...prev[activeTab]?.bottom,
          social_media: newSocialMedia,
        },
      },
    }));
  };

  // Remove a social media
  const handleRemoveSocialMedia = (index: number) => {
    const newSocialMedia = [
      ...(formData[activeTab]?.bottom?.social_media || []),
    ];
    newSocialMedia.splice(index, 1);

    setFormData((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        bottom: {
          ...prev[activeTab]?.bottom,
          social_media: newSocialMedia,
        },
      },
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Handle which section to edit
  const handleEditSection = (section: string) => {
    if (section !== documentId) {
      window.location.href = `/admin/collections/footer/edit/${section}`;
    }
  };

  // Render form fields based on the document type
  const renderFormFields = () => {
    // Since in this example we only have one document "main" for footer
    return (
      <div className="space-y-6">
        {/* Logo Section */}
        <div className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-black">
          <h3 className="mb-4 text-lg font-semibold">Logo Section</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Description
              </label>
              <textarea
                value={formData[activeTab]?.logo?.description || ""}
                onChange={(e) =>
                  handleNestedFormChange(
                    "logo",
                    "description",
                    "",
                    e.target.value,
                  )
                }
                className="h-32 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Enter footer logo description"
              />
            </div>
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Contact Label
              </label>
              <input
                type="text"
                value={formData[activeTab]?.logo?.contact_label || ""}
                onChange={(e) =>
                  handleNestedFormChange(
                    "logo",
                    "contact_label",
                    "",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Contact"
              />
            </div>
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Contact Email
              </label>
              <input
                type="email"
                value={formData[activeTab]?.logo?.contact_email || ""}
                onChange={(e) =>
                  handleNestedFormChange(
                    "logo",
                    "contact_email",
                    "",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="email@example.com"
              />
            </div>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-black">
          <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Section Title
              </label>
              <input
                type="text"
                value={formData[activeTab]?.quick_links?.title || ""}
                onChange={(e) =>
                  handleNestedFormChange(
                    "quick_links",
                    "title",
                    "",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Quick Links"
              />
            </div>

            {/* Quick Links */}
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Links
              </label>
              {(formData[activeTab]?.quick_links?.links || []).map(
                (link, index) => (
                  <div
                    key={`quick-link-${index}`}
                    className="mb-3 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={link.name || ""}
                      onChange={(e) =>
                        handleLinkChange(
                          "quick_links",
                          index,
                          "name",
                          e.target.value,
                        )
                      }
                      className="w-1/2 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Link Name"
                    />
                    <input
                      type="text"
                      value={link.url || ""}
                      onChange={(e) =>
                        handleLinkChange(
                          "quick_links",
                          index,
                          "url",
                          e.target.value,
                        )
                      }
                      className="w-1/2 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Link URL"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLink("quick_links", index)}
                      className="rounded-md bg-red-100 p-2 text-red-600 hover:bg-red-200"
                    >
                      ✕
                    </button>
                  </div>
                ),
              )}
              <button
                type="button"
                onClick={() => handleAddLink("quick_links")}
                className="mt-2 rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                + Add Link
              </button>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-black">
          <h3 className="mb-4 text-lg font-semibold">Support</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Section Title
              </label>
              <input
                type="text"
                value={formData[activeTab]?.support?.title || ""}
                onChange={(e) =>
                  handleNestedFormChange("support", "title", "", e.target.value)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Support"
              />
            </div>

            {/* Support Links */}
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Links
              </label>
              {(formData[activeTab]?.support?.links || []).map(
                (link, index) => (
                  <div
                    key={`support-link-${index}`}
                    className="mb-3 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={link.name || ""}
                      onChange={(e) =>
                        handleLinkChange(
                          "support",
                          index,
                          "name",
                          e.target.value,
                        )
                      }
                      className="w-1/2 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Link Name"
                    />
                    <input
                      type="text"
                      value={link.url || ""}
                      onChange={(e) =>
                        handleLinkChange(
                          "support",
                          index,
                          "url",
                          e.target.value,
                        )
                      }
                      className="w-1/2 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Link URL"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLink("support", index)}
                      className="rounded-md bg-red-100 p-2 text-red-600 hover:bg-red-200"
                    >
                      ✕
                    </button>
                  </div>
                ),
              )}
              <button
                type="button"
                onClick={() => handleAddLink("support")}
                className="mt-2 rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                + Add Link
              </button>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-black">
          <h3 className="mb-4 text-lg font-semibold">Newsletter</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Section Title
              </label>
              <input
                type="text"
                value={formData[activeTab]?.newsletter?.title || ""}
                onChange={(e) =>
                  handleNestedFormChange(
                    "newsletter",
                    "title",
                    "",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Newsletter"
              />
            </div>
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Description
              </label>
              <textarea
                value={formData[activeTab]?.newsletter?.description || ""}
                onChange={(e) =>
                  handleNestedFormChange(
                    "newsletter",
                    "description",
                    "",
                    e.target.value,
                  )
                }
                className="h-24 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Subscribe to receive future updates"
              />
            </div>
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Placeholder Text
              </label>
              <input
                type="text"
                value={formData[activeTab]?.newsletter?.placeholder || ""}
                onChange={(e) =>
                  handleNestedFormChange(
                    "newsletter",
                    "placeholder",
                    "",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Email address"
              />
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-black">
          <h3 className="mb-4 text-lg font-semibold">Bottom Section</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Language Selector Text
              </label>
              <input
                type="text"
                value={formData[activeTab]?.bottom?.language_selector || ""}
                onChange={(e) =>
                  handleNestedFormChange(
                    "bottom",
                    "language_selector",
                    "",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="English/Indonesia"
              />
            </div>

            {/* Bottom Links */}
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Bottom Links
              </label>
              {(formData[activeTab]?.bottom?.links || []).map((link, index) => (
                <div
                  key={`bottom-link-${index}`}
                  className="mb-3 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={link.name || ""}
                    onChange={(e) => {
                      const newLinks = [
                        ...(formData[activeTab]?.bottom?.links || []),
                      ];
                      newLinks[index] = {
                        ...newLinks[index],
                        name: e.target.value,
                      };

                      setFormData((prev) => ({
                        ...prev,
                        [activeTab]: {
                          ...prev[activeTab],
                          bottom: {
                            ...prev[activeTab]?.bottom,
                            links: newLinks,
                          },
                        },
                      }));
                    }}
                    className="w-1/2 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Link Name"
                  />
                  <input
                    type="text"
                    value={link.url || ""}
                    onChange={(e) => {
                      const newLinks = [
                        ...(formData[activeTab]?.bottom?.links || []),
                      ];
                      newLinks[index] = {
                        ...newLinks[index],
                        url: e.target.value,
                      };

                      setFormData((prev) => ({
                        ...prev,
                        [activeTab]: {
                          ...prev[activeTab],
                          bottom: {
                            ...prev[activeTab]?.bottom,
                            links: newLinks,
                          },
                        },
                      }));
                    }}
                    className="w-1/2 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Link URL"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newLinks = [
                        ...(formData[activeTab]?.bottom?.links || []),
                      ];
                      newLinks.splice(index, 1);

                      setFormData((prev) => ({
                        ...prev,
                        [activeTab]: {
                          ...prev[activeTab],
                          bottom: {
                            ...prev[activeTab]?.bottom,
                            links: newLinks,
                          },
                        },
                      }));
                    }}
                    className="rounded-md bg-red-100 p-2 text-red-600 hover:bg-red-200"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Copyright Text
              </label>
              <input
                type="text"
                value={formData[activeTab]?.bottom?.copyright || ""}
                onChange={(e) =>
                  handleNestedFormChange(
                    "bottom",
                    "copyright",
                    "",
                    e.target.value,
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={`© ${new Date().getFullYear()} Your Company. All rights reserved`}
              />
            </div>

            {/* Social Media Links */}
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Social Media
              </label>
              {(formData[activeTab]?.bottom?.social_media || []).map(
                (social, index) => (
                  <div
                    key={`social-${index}`}
                    className="mb-3 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={social.name || ""}
                      onChange={(e) =>
                        handleSocialMediaChange(index, "name", e.target.value)
                      }
                      className="w-1/2 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Platform Name"
                    />
                    <input
                      type="text"
                      value={social.url || ""}
                      onChange={(e) =>
                        handleSocialMediaChange(index, "url", e.target.value)
                      }
                      className="w-1/2 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="URL"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSocialMedia(index)}
                      className="rounded-md bg-red-100 p-2 text-red-600 hover:bg-red-200"
                    >
                      ✕
                    </button>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Footer preview component */}
      <FooterPreview
        data={fullFooterData}
        activeSection={"main"}
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

export default FooterEditor;
