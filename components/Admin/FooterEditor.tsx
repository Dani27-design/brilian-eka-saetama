"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import FooterPreview from "./FooterPreview";
import { Footer } from "@/types/footer";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import debounce from "lodash/debounce";

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

  // Add local state for immediate UI feedback
  const [localInputs, setLocalInputs] = useState<{
    [key: string]: string;
  }>({});

  // Load footer data for the preview once on mount
  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const docRef = doc(firestore, "footer", "main");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFullFooterData({ main: docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching footer data:", error);
      }
    };

    fetchFooterData();
  }, []); // Only run once on mount

  // Update preview data with debouncing and skip during typing
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
      setFullFooterData((prevData) => {
        // Create a deep copy to avoid reference issues
        const updatedData = JSON.parse(JSON.stringify(prevData || {}));

        // Update with current form data
        if (documentId === "main") {
          updatedData.main = formData;
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

      // Initialize local inputs for all form fields in the active tab
      const localState = {};

      // Process all sections
      const sections = [
        "logo",
        "quick_links",
        "support",
        "newsletter",
        "bottom",
      ];

      sections.forEach((section) => {
        if (initialData[activeTab]?.[section]) {
          // Handle direct text fields
          if (typeof initialData[activeTab][section] === "string") {
            localState[`${section}`] = initialData[activeTab][section];
          }

          // Handle nested objects
          if (typeof initialData[activeTab][section] === "object") {
            Object.keys(initialData[activeTab][section]).forEach((field) => {
              if (typeof initialData[activeTab][section][field] === "string") {
                localState[`${section}_${field}`] =
                  initialData[activeTab][section][field];
              }
            });
          }
        }
      });

      setLocalInputs(localState);
    }
  }, [initialData, activeTab]);

  // Debounced form change handler for simple fields
  const debouncedFormChange = useCallback(
    debounce((section: string, field: string, value: any) => {
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
    }, 500),
    [activeTab],
  );

  // Handle form data change for simple fields with local state for responsive UI
  const handleFormChange = (section: string, field: string, value: any) => {
    // Update local state immediately for responsive UI
    setLocalInputs((prev) => ({
      ...prev,
      [`${section}_${field}`]: value,
    }));

    // Debounce the update to formData to prevent lag
    debouncedFormChange(section, field, value);
  };

  // Debounced form change handler for nested fields
  const debouncedNestedFormChange = useCallback(
    debounce(
      (section: string, subSection: string, field: string, value: any) => {
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
      },
      500,
    ),
    [activeTab],
  );

  // Handle nested form data change with local state for responsive UI
  const handleNestedFormChange = (
    section: string,
    subSection: string,
    field: string,
    value: string,
  ) => {
    // Create a key for the local state
    const localKey = field
      ? `${section}_${subSection}_${field}`
      : `${section}_${subSection}`;

    // Update local state immediately for responsive UI
    setLocalInputs((prev) => ({
      ...prev,
      [localKey]: value,
    }));

    // Debounce the update to formData to prevent lag
    debouncedNestedFormChange(section, subSection, field, value);
  };

  // Debounced handler for link changes
  const debouncedLinkChange = useCallback(
    debounce((section: string, links: any[]) => {
      setFormData((prev) => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          [section]: {
            ...prev[activeTab]?.[section],
            links: links,
          },
        },
      }));
    }, 500),
    [activeTab],
  );

  // Handle link change with optimized updates
  const handleLinkChange = (
    section: string,
    index: number,
    field: string,
    value: string,
  ) => {
    // Create a new links array
    const newLinks = [...(formData[activeTab]?.[section]?.links || [])];
    newLinks[index] = {
      ...newLinks[index],
      [field]: value,
    };

    // Update local state for immediate feedback
    setLocalInputs((prev) => ({
      ...prev,
      [`${section}_links_${index}_${field}`]: value,
    }));

    // Debounce the update to formData to prevent lag
    debouncedLinkChange(section, newLinks);
  };

  // Add a new link - no need to debounce this as it's not typing
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

  // Remove a link - no need to debounce this as it's not typing
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

  // Debounced handler for social media changes
  const debouncedSocialMediaChange = useCallback(
    debounce((socialMedia: any[]) => {
      setFormData((prev) => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          bottom: {
            ...prev[activeTab]?.bottom,
            social_media: socialMedia,
          },
        },
      }));
    }, 500),
    [activeTab],
  );

  // Handle social media change with optimized updates
  const handleSocialMediaChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    // Create a new social media array
    const newSocialMedia = [
      ...(formData[activeTab]?.bottom?.social_media || []),
    ];
    newSocialMedia[index] = {
      ...newSocialMedia[index],
      [field]: value,
    };

    // Update local state for immediate feedback
    setLocalInputs((prev) => ({
      ...prev,
      [`social_media_${index}_${field}`]: value,
    }));

    // Debounce the update to formData to prevent lag
    debouncedSocialMediaChange(newSocialMedia);
  };

  // Add a new social media - no need to debounce this as it's not typing
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

  // Remove a social media - no need to debounce this as it's not typing
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

  // Handle bottom links change
  const handleBottomLinkChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    const newLinks = [...(formData[activeTab]?.bottom?.links || [])];
    newLinks[index] = {
      ...newLinks[index],
      [field]: value,
    };

    // Update local state for immediate feedback
    setLocalInputs((prev) => ({
      ...prev,
      [`bottom_links_${index}_${field}`]: value,
    }));

    // Debounce the update to formData to prevent lag
    debouncedLinkChange("bottom", newLinks);
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

  // Memoized renderFormFields function to prevent unnecessary re-renders
  const renderFormFields = useCallback(() => {
    // Get current section data
    const sectionData = formData[activeTab] || {};

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
                value={localInputs.logo_description || ""}
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
                value={localInputs.logo_contact_label || ""}
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
                value={localInputs.logo_contact_email || ""}
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
                value={localInputs.quick_links_title || ""}
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
              {(sectionData.quick_links?.links || []).map((link, index) => (
                <div
                  key={`quick-link-${index}`}
                  className="mb-3 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={
                      localInputs[`quick_links_links_${index}_name`] ||
                      link.name ||
                      ""
                    }
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
                    value={
                      localInputs[`quick_links_links_${index}_url`] ||
                      link.url ||
                      ""
                    }
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
              ))}
              {/* <button
                type="button"
                onClick={() => handleAddLink("quick_links")}
                className="mt-2 rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                + Add Link
              </button> */}
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
                value={localInputs.support_title || ""}
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
              {(sectionData.support?.links || []).map((link, index) => (
                <div
                  key={`support-link-${index}`}
                  className="mb-3 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={
                      localInputs[`support_links_${index}_name`] ||
                      link.name ||
                      ""
                    }
                    onChange={(e) =>
                      handleLinkChange("support", index, "name", e.target.value)
                    }
                    className="w-1/2 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Link Name"
                  />
                  <input
                    type="text"
                    value={
                      localInputs[`support_links_${index}_url`] ||
                      link.url ||
                      ""
                    }
                    onChange={(e) =>
                      handleLinkChange("support", index, "url", e.target.value)
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
              ))}
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
                value={localInputs.newsletter_title || ""}
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
                value={localInputs.newsletter_description || ""}
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
                value={localInputs.newsletter_placeholder || ""}
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
                value={localInputs.bottom_language_selector || ""}
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
              {(sectionData.bottom?.links || []).map((link, index) => (
                <div
                  key={`bottom-link-${index}`}
                  className="mb-3 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={
                      localInputs[`bottom_links_${index}_name`] ||
                      link.name ||
                      ""
                    }
                    onChange={(e) =>
                      handleBottomLinkChange(index, "name", e.target.value)
                    }
                    className="w-1/2 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Link Name"
                  />
                  <input
                    type="text"
                    value={
                      localInputs[`bottom_links_${index}_url`] || link.url || ""
                    }
                    onChange={(e) =>
                      handleBottomLinkChange(index, "url", e.target.value)
                    }
                    className="w-1/2 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Link URL"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveLink("bottom", index)}
                    className="rounded-md bg-red-100 p-2 text-red-600 hover:bg-red-200"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddLink("bottom")}
                className="mt-2 rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                + Add Link
              </button>
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Copyright Text
              </label>
              <input
                type="text"
                value={localInputs.bottom_copyright || ""}
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
              {(sectionData.bottom?.social_media || []).map((social, index) => (
                <div
                  key={`social-${index}`}
                  className="mb-3 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={
                      localInputs[`social_media_${index}_name`] ||
                      social.name ||
                      ""
                    }
                    onChange={(e) =>
                      handleSocialMediaChange(index, "name", e.target.value)
                    }
                    className="w-1/2 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Platform Name"
                  />
                  <input
                    type="text"
                    value={
                      localInputs[`social_media_${index}_url`] ||
                      social.url ||
                      ""
                    }
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
              ))}
              {/* <button
                type="button"
                onClick={handleAddSocialMedia}
                className="mt-2 rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                + Add Social Media
              </button> */}
            </div>
          </div>
        </div>
      </div>
    );
  }, [formData, activeTab, localInputs]); // Dependencies for memoization

  return (
    <div className="space-y-8">
      {/* Footer preview component - memoized to prevent re-renders during typing */}
      {useMemo(
        () => (
          <FooterPreview
            data={fullFooterData}
            activeSection={"main"}
            onEditSection={handleEditSection}
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
          />
        ),
        [fullFooterData, previewMode],
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
