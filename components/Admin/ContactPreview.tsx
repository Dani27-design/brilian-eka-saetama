"use client";

import { useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";

interface ContactPreviewProps {
  data: {
    [key: string]: {
      [lang: string]: any;
    };
  };
  activeSection: string | null;
  onEditSection?: (section: string) => void;
  previewMode?: "desktop" | "mobile";
  onPreviewModeChange?: (mode: "desktop" | "mobile") => void;
}

const ContactPreview = ({
  data,
  activeSection,
  onEditSection,
  previewMode = "desktop",
  onPreviewModeChange,
}: ContactPreviewProps) => {
  const { language } = useLanguage();
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [internalPreviewMode, setInternalPreviewMode] = useState<
    "desktop" | "mobile"
  >(previewMode);
  const [consent, setConsent] = useState(false);

  // Use internal state if no external control is provided
  const currentPreviewMode = onPreviewModeChange
    ? previewMode
    : internalPreviewMode;

  const handlePreviewModeChange = (mode: "desktop" | "mobile") => {
    if (onPreviewModeChange) {
      onPreviewModeChange(mode);
    } else {
      setInternalPreviewMode(mode);
    }
  };

  // Process the contact data for the current language
  const processContactData = () => {
    const currentLang = language || "en";

    // Initialize with default values
    let contactInfo = {
      title: currentLang === "en" ? "Find Us" : "Temukan Kami",
      location: {
        title: currentLang === "en" ? "Our Location" : "Lokasi Kami",
        text: "Jl. Wonocolo Utara V No.22, Surabaya",
      },
      email: {
        title: currentLang === "en" ? "Email us" : "Email kami",
        text: "info@brilineska.com",
      },
      phone: {
        title: currentLang === "en" ? "Phone" : "Telepon",
        text: "+62 852-3160-0808",
      },
    };

    let messageForm = {
      title: currentLang === "en" ? "Send Message" : "Kirim Pesan",
      form: {
        name: {
          placeholder: currentLang === "en" ? "Full Name" : "Nama Lengkap",
        },
        email: {
          placeholder: currentLang === "en" ? "Email address" : "Alamat Email",
        },
        subject: { placeholder: currentLang === "en" ? "Subject" : "Subjek" },
        phone: {
          placeholder: currentLang === "en" ? "Phone number" : "Nomor Telepon",
        },
        message: { placeholder: currentLang === "en" ? "Message" : "Pesan" },
      },
      consent_text:
        currentLang === "en"
          ? 'By clicking Checkbox, you agree to use our "Form" terms And consent cookie usage in browser.'
          : 'Dengan mengklik Kotak centang, Anda menyetujui penggunaan "Formulir" kami dan penggunaan cookie di browser.',
      submit_button: currentLang === "en" ? "Send Message" : "Kirim Pesan",
    };

    // Override with data from props if available
    if (data.find_us && data.find_us[currentLang]) {
      contactInfo = { ...contactInfo, ...data.find_us[currentLang] };
    }

    if (data.send_message && data.send_message[currentLang]) {
      messageForm = { ...messageForm, ...data.send_message[currentLang] };
    }

    return { contactInfo, messageForm };
  };

  const { contactInfo, messageForm } = processContactData();

  // Render contact content for device frames
  const renderContactContent = () => (
    <div className="mx-auto w-full py-5">
      <div className="relative mx-auto w-full p-4 text-sm">
        <div className="absolute left-0 top-0 -z-1 h-2/3 w-full rounded-lg bg-gradient-to-t from-transparent to-[#dee7ff47] dark:bg-gradient-to-t dark:to-[#252A42]"></div>
        {/* Contact Form and Info Container */}
        <div
          className={`flex flex-wrap ${
            currentPreviewMode === "mobile"
              ? "flex-col space-y-4"
              : "lg:flex-row"
          }`}
        >
          {/* Contact Form */}
          <div
            className={`relative w-full cursor-pointer rounded-lg bg-white p-4 shadow-solid-8 dark:border dark:border-strokedark dark:bg-black ${
              currentPreviewMode === "mobile" ? "w-full" : "lg:w-3/4"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              activeSection !== "send_message" &&
                onEditSection &&
                onEditSection("send_message");
            }}
            onMouseEnter={() => setHoveredSection("send_message")}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <h2 className="mb-6 text-xl font-semibold text-black dark:text-white">
              {messageForm.title}
            </h2>

            {/* Form */}
            <form>
              <div
                className={`mb-6 flex flex-col gap-6 ${
                  currentPreviewMode === "mobile"
                    ? ""
                    : "lg:flex-row lg:justify-between lg:gap-8"
                }`}
              >
                <div className="w-full">
                  <label htmlFor="name" className="sr-only">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder={messageForm.form.name.placeholder}
                    className="w-full border-b border-stroke bg-transparent py-2 focus:border-waterloo focus:placeholder:text-black focus-visible:outline-none dark:border-strokedark dark:focus:border-manatee dark:focus:placeholder:text-white"
                  />
                </div>

                <div className="w-full">
                  <label htmlFor="email" className="sr-only">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder={messageForm.form.email.placeholder}
                    className="w-full border-b border-stroke bg-transparent py-2 focus:border-waterloo focus:placeholder:text-black focus-visible:outline-none dark:border-strokedark dark:focus:border-manatee dark:focus:placeholder:text-white"
                  />
                </div>
              </div>

              <div
                className={`mb-6 flex flex-col gap-6 ${
                  currentPreviewMode === "mobile"
                    ? ""
                    : "lg:flex-row lg:justify-between lg:gap-8"
                }`}
              >
                <div className="w-full">
                  <label htmlFor="subject" className="sr-only">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    placeholder={messageForm.form.subject.placeholder}
                    className="w-full border-b border-stroke bg-transparent py-2 focus:border-waterloo focus:placeholder:text-black focus-visible:outline-none dark:border-strokedark dark:focus:border-manatee dark:focus:placeholder:text-white"
                  />
                </div>

                <div className="w-full">
                  <label htmlFor="phone" className="sr-only">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    placeholder={messageForm.form.phone.placeholder}
                    className="w-full border-b border-stroke bg-transparent py-2 focus:border-waterloo focus:placeholder:text-black focus-visible:outline-none dark:border-strokedark dark:focus:border-manatee dark:focus:placeholder:text-white"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="message" className="sr-only">
                  Message
                </label>
                <textarea
                  name="message"
                  rows={4}
                  placeholder={messageForm.form.message.placeholder}
                  className="w-full border-b border-stroke bg-transparent focus:border-waterloo focus:placeholder:text-black focus-visible:outline-none dark:border-strokedark dark:focus:border-manatee dark:focus:placeholder:text-white"
                ></textarea>
              </div>

              <div className="flex flex-wrap gap-4 xl:justify-between">
                <div className="mb-4 flex md:mb-0">
                  <div className="relative flex items-center">
                    <input
                      id="preview-checkbox"
                      type="checkbox"
                      checked={consent}
                      onChange={() => setConsent(!consent)}
                      className="peer sr-only"
                    />
                    <span
                      onClick={() => setConsent(!consent)}
                      className={`group mt-2 flex h-5 min-w-[20px] cursor-pointer items-center justify-center rounded border border-gray-300 bg-gray-100 text-blue-600 ${
                        consent ? "bg-primary" : ""
                      } dark:border-gray-600 dark:bg-gray-700`}
                    >
                      <svg
                        className={`${
                          consent ? "opacity-100" : "opacity-0"
                        } peer-checked:group-[]:opacity-100`}
                        width="10"
                        height="8"
                        viewBox="0 0 10 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M9.70704 0.792787C9.8945 0.980314 9.99982 1.23462 9.99982 1.49979C9.99982 1.76495 9.8945 2.01926 9.70704 2.20679L4.70704 7.20679C4.51951 7.39426 4.26521 7.49957 4.00004 7.49957C3.73488 7.49957 3.48057 7.39426 3.29304 7.20679L0.293041 4.20679C0.110883 4.01818 0.0100885 3.76558 0.0123633 3.50339C0.0146381 3.24119 0.119814 2.99038 0.305222 2.80497C0.490631 2.61956 0.741443 2.51438 1.00364 2.5121C1.26584 2.50983 1.51844 2.61062 1.70704 2.79279L4.00004 5.08579L8.29304 0.792787C8.48057 0.605316 8.73488 0.5 9.00004 0.5C9.26521 0.5 9.51951 0.605316 9.70704 0.792787Z"
                          fill="white"
                        />
                      </svg>
                    </span>
                    <label
                      htmlFor="preview-checkbox"
                      className="flex max-w-[425px] cursor-pointer select-none pl-5"
                    >
                      {messageForm.consent_text}
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!consent}
                  aria-label="send message"
                  className={`inline-flex items-center gap-2.5 rounded-full bg-black px-6 py-3 font-medium text-white duration-300 ease-in-out hover:bg-blackho dark:bg-btndark ${
                    !consent ? "cursor-not-allowed opacity-70" : ""
                  }`}
                >
                  {messageForm.submit_button}
                  <svg
                    className="fill-white"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.4767 6.16664L6.00668 1.69664L7.18501 0.518311L13.6667 6.99998L7.18501 13.4816L6.00668 12.3033L10.4767 7.83331H0.333344V6.16664H10.4767Z"
                      fill=""
                    />
                  </svg>
                </button>
              </div>
            </form>

            {(hoveredSection === "send_message" ||
              activeSection === "send_message") && (
              <>
                <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
                <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                  Send Message Form Section (Click to Edit)
                </div>
              </>
            )}
          </div>

          {/* Contact Info */}
          <div
            className={`relative w-full cursor-pointer ${
              currentPreviewMode === "mobile" ? "w-full" : "lg:w-1/4"
            } p-4`}
            onClick={(e) => {
              e.stopPropagation();
              activeSection !== "find_us" &&
                onEditSection &&
                onEditSection("find_us");
            }}
            onMouseEnter={() => setHoveredSection("find_us")}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <h2 className="mb-8 text-lg font-semibold text-black dark:text-white">
              {contactInfo.title}
            </h2>

            {/* Location section */}
            <div className="mb-6">
              <h3 className="text-md mb-3 font-medium text-black hover:text-primary dark:text-white dark:hover:text-primary">
                {contactInfo.location.title}
              </h3>
              <p className="cursor-pointer text-xs hover:text-primary dark:hover:text-primary">
                {contactInfo.location.text}
              </p>
            </div>

            {/* Email section */}
            <div className="mb-6">
              <h3 className="text-md mb-3 font-medium text-black dark:text-white">
                {contactInfo.email.title}
              </h3>
              <p className="text-xs">{contactInfo.email.text}</p>
            </div>

            {/* Phone section */}
            <div>
              <h4 className="text-md mb-3 font-medium text-black dark:text-white">
                {contactInfo.phone.title}
              </h4>
              <p className="cursor-pointer text-xs hover:text-primary dark:hover:text-primary">
                {contactInfo.phone.text}
              </p>
            </div>

            {(hoveredSection === "find_us" || activeSection === "find_us") && (
              <>
                <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
                <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                  Find Us Section (Click to Edit)
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-lg border bg-white p-6 dark:bg-black">
      {/* Active section indicator */}
      {activeSection && (
        <div className="mb-3 rounded-md bg-primary/10 p-2 text-center shadow-sm">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
            <span className="text-sm font-medium text-primary">
              {activeSection === "contact_title" ? (
                <span>Editing Contact Title</span>
              ) : activeSection === "send_message" ? (
                <span>Editing Message Form</span>
              ) : (
                <span>Editing Contact Info</span>
              )}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Click on other sections to edit them
          </p>
        </div>
      )}

      {/* Preview mode toggle buttons */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-black dark:text-white">
          Contact Section
        </h2>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => handlePreviewModeChange("desktop")}
            className={`rounded-md px-3 py-1 text-sm ${
              currentPreviewMode === "desktop"
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            Desktop
          </button>
          <button
            type="button"
            onClick={() => handlePreviewModeChange("mobile")}
            className={`rounded-md px-3 py-1 text-sm ${
              currentPreviewMode === "mobile"
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            Mobile
          </button>
        </div>
      </div>

      {/* Device mockup container */}
      <div className="mx-auto max-w-fit">
        {currentPreviewMode === "mobile" ? (
          /* Mobile Phone Mockup */
          <div className="mx-auto w-[350px]">
            <div className="relative overflow-hidden rounded-[36px] border-[14px] border-gray-900 bg-gray-900 shadow-xl">
              {/* Phone "notch" */}
              <div className="absolute left-1/2 top-0 z-10 h-6 w-40 -translate-x-1/2 rounded-b-lg bg-gray-900"></div>

              {/* Phone screen frame */}
              <div className="relative h-[650px] w-full overflow-hidden bg-white dark:bg-black">
                {/* Status bar */}
                <div className="sticky top-0 z-10 flex h-6 w-full items-center justify-between bg-gray-100 px-4 dark:bg-gray-800">
                  <div className="text-[10px] font-medium">9:41</div>
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-3 rounded-sm bg-gray-400"></div>
                    <div className="h-2 w-3 rounded-sm bg-gray-400"></div>
                    <div className="h-2 w-3 rounded-sm bg-gray-400"></div>
                  </div>
                </div>

                {/* Scrollable content area */}
                <div className="h-[644px] overflow-y-auto overflow-x-hidden bg-white dark:bg-black">
                  <div className="origin-top scale-[0.9] pb-12 pt-0">
                    {renderContactContent()}
                  </div>
                </div>
              </div>

              {/* Home indicator */}
              <div className="absolute bottom-1 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-gray-300"></div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              Mobile Preview • Scroll to see more content{"\n"}
              Hover over and click on any section to edit its content.
            </div>
          </div>
        ) : (
          /* Desktop Browser Mockup */
          <div className="mx-auto max-w-[900px]">
            <div className="overflow-hidden rounded-lg border border-gray-300 shadow-lg">
              {/* Browser toolbar */}
              <div className="flex h-10 items-center space-x-1.5 bg-gray-200 px-3 dark:bg-gray-800">
                {/* Window controls */}
                <div className="flex space-x-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>

                {/* URL bar */}
                <div className="ml-4 flex h-6 flex-1 items-center rounded-md bg-white px-3 dark:bg-gray-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2 h-4 w-4 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                    />
                  </svg>
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    brilian-eka-saetama.com/#contact
                  </span>
                </div>

                {/* Browser icons */}
                <div className="ml-4 flex space-x-2">
                  <div className="h-4 w-4 rounded-full bg-gray-400"></div>
                  <div className="h-4 w-4 rounded-full bg-gray-400"></div>
                </div>
              </div>

              {/* Browser content */}
              <div className="h-fit max-h-[600px] min-h-[250px] overflow-y-auto overflow-x-hidden bg-white dark:bg-black">
                <div className="origin-top scale-[0.85] pb-5">
                  {renderContactContent()}
                </div>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              Desktop Preview • Scroll to see more content{"\n"}
              Hover over and click on any section to edit its content.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactPreview;
