"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import ContactPreview from "./ContactPreview";
import debounce from "lodash/debounce";

interface ContactEditorProps {
  collectionName: string;
  documentId: string;
  initialData: any;
  onSubmit: (data: any) => Promise<void>;
  isSaving: boolean;
}

const ContactEditor = ({
  collectionName,
  documentId,
  initialData,
  onSubmit,
  isSaving,
}: ContactEditorProps) => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<any>(
    initialData || { en: {}, id: {} },
  );
  const [fullContactData, setFullContactData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>(language || "en");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );

  // Local state for immediate UI updates during typing
  const [localInputs, setLocalInputs] = useState<{
    [key: string]: any;
  }>({});

  // Load all contact-related data for the preview only once initially
  useEffect(() => {
    const fetchContactData = async () => {
      try {
        const docTypes = ["contact_title", "find_us", "send_message"];
        const data = {};

        for (const docType of docTypes) {
          const docRef = doc(firestore, "contact", docType);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            data[docType] = docSnap.data();
          }
        }

        setFullContactData(data);
      } catch (error) {
        console.error("Error fetching contact data:", error);
      }
    };

    fetchContactData();
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
      setFullContactData((prevData) => {
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

      // Initialize local inputs for immediate UI feedback
      if (documentId === "contact_title") {
        setLocalInputs({
          title: initialData[activeTab]?.title || "",
          subtitle: initialData[activeTab]?.subtitle || "",
        });
      } else if (documentId === "find_us") {
        setLocalInputs({
          title: initialData[activeTab]?.title || "",
          location_title: initialData[activeTab]?.location?.title || "",
          location_text: initialData[activeTab]?.location?.text || "",
          email_title: initialData[activeTab]?.email?.title || "",
          email_text: initialData[activeTab]?.email?.text || "",
          phone_title: initialData[activeTab]?.phone?.title || "",
          phone_text: initialData[activeTab]?.phone?.text || "",
        });
      } else if (documentId === "send_message") {
        setLocalInputs({
          title: initialData[activeTab]?.title || "",
          name_placeholder:
            initialData[activeTab]?.form?.name?.placeholder || "",
          email_placeholder:
            initialData[activeTab]?.form?.email?.placeholder || "",
          subject_placeholder:
            initialData[activeTab]?.form?.subject?.placeholder || "",
          phone_placeholder:
            initialData[activeTab]?.form?.phone?.placeholder || "",
          message_placeholder:
            initialData[activeTab]?.form?.message?.placeholder || "",
          consent_text: initialData[activeTab]?.consent_text || "",
          submit_button: initialData[activeTab]?.submit_button || "",
        });
      }
    }
  }, [initialData, documentId, activeTab]);

  // Handle form data change with debouncing
  const handleFormChange = useCallback(
    (lang: string, field: string, value: any) => {
      setFormData((prev) => ({
        ...prev,
        [lang]: {
          ...(prev[lang] || {}),
          [field]: value,
        },
      }));
    },
    [],
  );

  // Debounced update for text fields
  const debouncedFormUpdate = useCallback(
    debounce((lang: string, field: string, value: any) => {
      handleFormChange(lang, field, value);
    }, 500),
    [handleFormChange],
  );

  // Handle text input changes with local state for responsive UI
  const handleTextInputChange = (e, lang: string, field: string) => {
    const value = e.target.value;

    // Update local state immediately for responsive UI
    setLocalInputs((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Debounce the update to formData to prevent lag
    debouncedFormUpdate(lang, field, value);
  };

  // Handle nested form data changes with debouncing
  const handleNestedFormChange = useCallback(
    (lang: string, parentField: string, field: string, value: any) => {
      setFormData((prev) => ({
        ...prev,
        [lang]: {
          ...(prev[lang] || {}),
          [parentField]: {
            ...(prev[lang]?.[parentField] || {}),
            [field]: value,
          },
        },
      }));
    },
    [],
  );

  // Debounced update for nested fields
  const debouncedNestedUpdate = useCallback(
    debounce((lang: string, parentField: string, field: string, value: any) => {
      handleNestedFormChange(lang, parentField, field, value);
    }, 500),
    [handleNestedFormChange],
  );

  // Handle nested text input changes with local state for responsive UI
  const handleNestedTextChange = (
    e,
    lang: string,
    parentField: string,
    field: string,
  ) => {
    const value = e.target.value;

    // Update local state immediately for responsive UI
    setLocalInputs((prev) => ({
      ...prev,
      [`${parentField}_${field}`]: value,
    }));

    // Debounce the update to formData to prevent lag
    debouncedNestedUpdate(lang, parentField, field, value);
  };

  // Handle deeply nested form data changes (for fields object in send_message)
  const handleFieldsFormChange = useCallback(
    (lang: string, field: string, subField: string, value: any) => {
      setFormData((prev) => ({
        ...prev,
        [lang]: {
          ...(prev[lang] || {}),
          form: {
            ...(prev[lang]?.form || {}),
            [field]: {
              ...(prev[lang]?.form?.[field] || {}),
              [subField]: value,
            },
          },
        },
      }));
    },
    [],
  );

  // Debounced update for fields form
  const debouncedFieldsUpdate = useCallback(
    debounce((lang: string, field: string, subField: string, value: any) => {
      handleFieldsFormChange(lang, field, subField, value);
    }, 500),
    [handleFieldsFormChange],
  );

  // Handle fields form text input changes with local state for responsive UI
  const handleFieldsTextChange = (
    e,
    lang: string,
    field: string,
    subField: string,
  ) => {
    const value = e.target.value;

    // Update local state immediately for responsive UI
    setLocalInputs((prev) => ({
      ...prev,
      [`${field}_${subField}`]: value,
    }));

    // Debounce the update to formData to prevent lag
    debouncedFieldsUpdate(lang, field, subField, value);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Handle which section to edit
  const handleEditSection = (section: string) => {
    if (section !== documentId) {
      window.location.href = `/admin/collections/contact/edit/${section}`;
    }
  };

  // Render form fields based on the document type
  const renderFormFields = () => {
    switch (documentId) {
      case "contact_title":
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Contact Title
              </label>
              <input
                type="text"
                value={localInputs.title || ""}
                onChange={(e) => handleTextInputChange(e, activeTab, "title")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={activeTab === "en" ? "Contact Us" : "Hubungi Kami"}
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the main title for the contact section
              </p>
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Contact Subtitle
              </label>
              <textarea
                value={localInputs.subtitle || ""}
                onChange={(e) =>
                  handleTextInputChange(e, activeTab, "subtitle")
                }
                className="h-32 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={
                  activeTab === "en"
                    ? "Have a project in mind? Let's connect."
                    : "Punya proyek di benak Anda? Mari terhubung."
                }
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the subtitle or description for the contact section
              </p>
            </div>
          </div>
        );

      case "find_us":
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Section Title
              </label>
              <input
                type="text"
                value={localInputs.title || ""}
                onChange={(e) => handleTextInputChange(e, activeTab, "title")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={activeTab === "en" ? "Find Us" : "Temukan Kami"}
              />
            </div>

            {/* Location Section */}
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 font-medium text-gray-700 dark:text-gray-300">
                Location Information
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Location Title
                  </label>
                  <input
                    type="text"
                    value={localInputs.location_title || ""}
                    onChange={(e) =>
                      handleNestedTextChange(e, activeTab, "location", "title")
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder={
                      activeTab === "en" ? "Our Location" : "Lokasi Kami"
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address
                  </label>
                  <textarea
                    value={localInputs.location_text || ""}
                    onChange={(e) =>
                      handleNestedTextChange(e, activeTab, "location", "text")
                    }
                    className="h-24 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Jl. Wonocolo Utara V No.22, Surabaya"
                  />
                </div>
              </div>
            </div>

            {/* Email Section */}
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 font-medium text-gray-700 dark:text-gray-300">
                Email Information
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Title
                  </label>
                  <input
                    type="text"
                    value={localInputs.email_title || ""}
                    onChange={(e) =>
                      handleNestedTextChange(e, activeTab, "email", "title")
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder={activeTab === "en" ? "Email us" : "Email kami"}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <input
                    type="text"
                    value={localInputs.email_text || ""}
                    onChange={(e) =>
                      handleNestedTextChange(e, activeTab, "email", "text")
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="info@brilineska.com"
                  />
                </div>
              </div>
            </div>

            {/* Phone Section */}
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 font-medium text-gray-700 dark:text-gray-300">
                Phone Information
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone Title
                  </label>
                  <input
                    type="text"
                    value={localInputs.phone_title || ""}
                    onChange={(e) =>
                      handleNestedTextChange(e, activeTab, "phone", "title")
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder={activeTab === "en" ? "Phone" : "Telepon"}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={localInputs.phone_text || ""}
                    onChange={(e) =>
                      handleNestedTextChange(e, activeTab, "phone", "text")
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="+62 852-3160-0808"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "send_message":
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Form Title
              </label>
              <input
                type="text"
                value={localInputs.title || ""}
                onChange={(e) => handleTextInputChange(e, activeTab, "title")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={
                  activeTab === "en" ? "Send Message" : "Kirim Pesan"
                }
              />
            </div>

            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 font-medium text-gray-700 dark:text-gray-300">
                Form Fields
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name Field Placeholder
                  </label>
                  <input
                    type="text"
                    value={localInputs.name_placeholder || ""}
                    onChange={(e) =>
                      handleFieldsTextChange(
                        e,
                        activeTab,
                        "name",
                        "placeholder",
                      )
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder={
                      activeTab === "en" ? "Full Name" : "Nama Lengkap"
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Field Placeholder
                  </label>
                  <input
                    type="text"
                    value={localInputs.email_placeholder || ""}
                    onChange={(e) =>
                      handleFieldsTextChange(
                        e,
                        activeTab,
                        "email",
                        "placeholder",
                      )
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder={
                      activeTab === "en" ? "Email address" : "Alamat Email"
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subject Field Placeholder
                  </label>
                  <input
                    type="text"
                    value={localInputs.subject_placeholder || ""}
                    onChange={(e) =>
                      handleFieldsTextChange(
                        e,
                        activeTab,
                        "subject",
                        "placeholder",
                      )
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder={activeTab === "en" ? "Subject" : "Subjek"}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone Field Placeholder
                  </label>
                  <input
                    type="text"
                    value={localInputs.phone_placeholder || ""}
                    onChange={(e) =>
                      handleFieldsTextChange(
                        e,
                        activeTab,
                        "phone",
                        "placeholder",
                      )
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder={
                      activeTab === "en" ? "Phone number" : "Nomor Telepon"
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message Field Placeholder
                  </label>
                  <input
                    type="text"
                    value={localInputs.message_placeholder || ""}
                    onChange={(e) =>
                      handleFieldsTextChange(
                        e,
                        activeTab,
                        "message",
                        "placeholder",
                      )
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder={activeTab === "en" ? "Message" : "Pesan"}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Consent Text
              </label>
              <textarea
                value={localInputs.consent_text || ""}
                onChange={(e) =>
                  handleTextInputChange(e, activeTab, "consent_text")
                }
                className="h-24 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={
                  activeTab === "en"
                    ? 'By clicking Checkbox, you agree to use our "Form" terms And consent cookie usage in browser.'
                    : 'Dengan mengklik Kotak centang, Anda menyetujui penggunaan "Formulir" kami dan penggunaan cookie di browser.'
                }
              />
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                Submit Button Text
              </label>
              <input
                type="text"
                value={localInputs.submit_button || ""}
                onChange={(e) =>
                  handleTextInputChange(e, activeTab, "submit_button")
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder={
                  activeTab === "en" ? "Send Message" : "Kirim Pesan"
                }
              />
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
  }, [documentId, activeTab, localInputs]); // Only re-render when these change

  return (
    <div className="space-y-8">
      {/* Contact preview component - memoized to prevent re-renders during typing */}
      {useMemo(
        () => (
          <ContactPreview
            data={fullContactData}
            activeSection={documentId}
            onEditSection={handleEditSection}
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
          />
        ),
        [fullContactData, documentId, previewMode],
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

export default ContactEditor;
