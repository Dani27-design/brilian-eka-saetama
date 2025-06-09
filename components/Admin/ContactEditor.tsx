"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { useLanguage } from "@/app/context/LanguageContext";
import ContactPreview from "./ContactPreview";

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

  // Load all contact-related data for the preview
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

        // If current document is one of these, use our form data for preview
        if (docTypes.includes(documentId)) {
          data[documentId] = formData;
        }

        setFullContactData(data);
      } catch (error) {
        console.error("Error fetching contact data:", error);
      }
    };

    fetchContactData();
  }, [documentId, formData]);

  // Make sure formData is properly initialized when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Handle form data change
  const handleFormChange = (lang: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [lang]: {
        ...(prev[lang] || {}),
        [field]: value,
      },
    }));
  };

  // Handle nested form data changes
  const handleNestedFormChange = (
    lang: string,
    parentField: string,
    field: string,
    value: any,
  ) => {
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
  };

  // Handle deeply nested form data changes (for fields object in send_message)
  const handleFieldsFormChange = (
    lang: string,
    field: string,
    subField: string,
    value: any,
  ) => {
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
                value={formData[activeTab]?.title || ""}
                onChange={(e) =>
                  handleFormChange(activeTab, "title", e.target.value)
                }
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
                value={formData[activeTab]?.subtitle || ""}
                onChange={(e) =>
                  handleFormChange(activeTab, "subtitle", e.target.value)
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
                value={formData[activeTab]?.title || ""}
                onChange={(e) =>
                  handleFormChange(activeTab, "title", e.target.value)
                }
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
                    value={formData[activeTab]?.location?.title || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        activeTab,
                        "location",
                        "title",
                        e.target.value,
                      )
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
                    value={formData[activeTab]?.location?.text || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        activeTab,
                        "location",
                        "text",
                        e.target.value,
                      )
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
                    value={formData[activeTab]?.email?.title || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        activeTab,
                        "email",
                        "title",
                        e.target.value,
                      )
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
                    value={formData[activeTab]?.email?.text || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        activeTab,
                        "email",
                        "text",
                        e.target.value,
                      )
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
                    value={formData[activeTab]?.phone?.title || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        activeTab,
                        "phone",
                        "title",
                        e.target.value,
                      )
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
                    value={formData[activeTab]?.phone?.text || ""}
                    onChange={(e) =>
                      handleNestedFormChange(
                        activeTab,
                        "phone",
                        "text",
                        e.target.value,
                      )
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
                value={formData[activeTab]?.title || ""}
                onChange={(e) =>
                  handleFormChange(activeTab, "title", e.target.value)
                }
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
                    value={formData[activeTab]?.form?.name?.placeholder || ""}
                    onChange={(e) =>
                      handleFieldsFormChange(
                        activeTab,
                        "name",
                        "placeholder",
                        e.target.value,
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
                    value={formData[activeTab]?.form?.email?.placeholder || ""}
                    onChange={(e) =>
                      handleFieldsFormChange(
                        activeTab,
                        "email",
                        "placeholder",
                        e.target.value,
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
                    value={
                      formData[activeTab]?.form?.subject?.placeholder || ""
                    }
                    onChange={(e) =>
                      handleFieldsFormChange(
                        activeTab,
                        "subject",
                        "placeholder",
                        e.target.value,
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
                    value={formData[activeTab]?.form?.phone?.placeholder || ""}
                    onChange={(e) =>
                      handleFieldsFormChange(
                        activeTab,
                        "phone",
                        "placeholder",
                        e.target.value,
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
                    value={
                      formData[activeTab]?.form?.message?.placeholder || ""
                    }
                    onChange={(e) =>
                      handleFieldsFormChange(
                        activeTab,
                        "message",
                        "placeholder",
                        e.target.value,
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
                value={formData[activeTab]?.consent_text || ""}
                onChange={(e) =>
                  handleFormChange(activeTab, "consent_text", e.target.value)
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
                value={formData[activeTab]?.submit_button || ""}
                onChange={(e) =>
                  handleFormChange(activeTab, "submit_button", e.target.value)
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

  return (
    <div className="space-y-8">
      {/* Contact preview component */}
      <ContactPreview
        data={fullContactData}
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

export default ContactEditor;
