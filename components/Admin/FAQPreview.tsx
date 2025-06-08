"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useLanguage } from "@/app/context/LanguageContext";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

interface FAQPreviewProps {
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

const FAQPreview = ({
  data,
  activeSection,
  onEditSection,
  previewMode = "desktop",
  onPreviewModeChange,
}: FAQPreviewProps) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [internalPreviewMode, setInternalPreviewMode] = useState<
    "desktop" | "mobile"
  >(previewMode);
  const [activeFaq, setActiveFaq] = useState<number>(1);

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

  // Process the FAQ data for the current language
  const processFAQData = () => {
    const currentLang = language || "en";

    // Get FAQ title
    const getFAQTitle = () => {
      if (!data.faq_title || !data.faq_title[currentLang]) {
        return currentLang === "en" ? "OUR FAQS" : "TANYA JAWAB KAMI";
      }
      return data.faq_title[currentLang];
    };

    // Get FAQ subtitle
    const getFAQSubtitle = () => {
      if (!data.faq_subtitle || !data.faq_subtitle[currentLang]) {
        return currentLang === "en"
          ? "Frequently Asked Questions"
          : "Pertanyaan yang Sering Diajukan";
      }
      return data.faq_subtitle[currentLang];
    };

    // Get FAQ items
    const getFAQItems = () => {
      try {
        if (!data.faq_items || !data.faq_items[currentLang]) return [];
        const items = data.faq_items[currentLang];
        return Array.isArray(items) ? items : [];
      } catch (e) {
        console.error("Error parsing FAQ items:", e);
        return [];
      }
    };

    return {
      title: getFAQTitle(),
      subtitle: getFAQSubtitle(),
      items: getFAQItems(),
    };
  };

  const faqContent = processFAQData();

  // Handle FAQ toggle
  const handleFaqToggle = (id: number) => {
    activeFaq === id ? setActiveFaq(0) : setActiveFaq(id);
  };

  // Render FAQ Item Component
  const FAQItemComponent = ({
    faqData,
  }: {
    faqData: {
      activeFaq: number;
      id: number;
      handleFaqToggle: (id: number) => void;
      question: string;
      answer: string;
    };
  }) => {
    const { activeFaq, id, handleFaqToggle, question, answer } = faqData;

    return (
      <div className="flex flex-col border-b border-stroke last-of-type:border-none dark:border-strokedark">
        <button
          onClick={() => {
            handleFaqToggle(id);
          }}
          className={`flex cursor-pointer items-center justify-between px-3 py-4 text-start text-base font-medium text-black dark:text-white ${
            currentPreviewMode === "desktop" ? "lg:px-9 lg:py-6" : ""
          }`}
        >
          <p className="w-[90%]">{question}</p>

          {activeFaq === id ? (
            <svg
              width="18"
              height="4"
              viewBox="0 0 18 4"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.1666 0.833374H10.1666H7.83331H0.833313V3.16671H7.83331H10.1666H17.1666V0.833374Z"
                fill="currentColor"
              />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.83331 7.83337V0.833374H10.1666V7.83337H17.1666V10.1667H10.1666V17.1667H7.83331V10.1667H0.833313V7.83337H7.83331Z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>
        <p
          className={`border-t border-stroke px-3 py-4 dark:border-strokedark ${
            currentPreviewMode === "desktop" ? "lg:px-9 lg:py-6" : ""
          } ${activeFaq === id ? "block" : "hidden"}`}
        >
          {answer}
        </p>
      </div>
    );
  };

  // Render FAQ content for device frames
  const renderFAQContent = () => (
    <section id="faq" className="my-0 py-8">
      <div className="relative mx-auto max-w-c-1280 px-4 md:px-8 xl:px-0">
        <div className="absolute -z-1 h-full w-full">
          <Image
            src="/images/shape/shape-dotted-light-02.svg"
            alt="Shape"
            fill
            sizes="100vw"
            style={{
              objectFit: "contain",
              objectPosition: "center",
            }}
            className="absolute left-0 top-0 -z-1 dark:hidden"
            quality={50}
          />

          <Image
            src="/images/shape/shape-dotted-dark-02.svg"
            alt="Shape"
            fill
            sizes="100vw"
            style={{
              objectFit: "contain",
              objectPosition: "center",
            }}
            className="absolute left-0 top-0 -z-1 hidden dark:block"
            quality={50}
          />
        </div>

        <div
          className={`flex flex-wrap gap-8 ${
            currentPreviewMode === "mobile"
              ? "flex-col"
              : "md:flex-nowrap md:items-center xl:gap-25"
          }`}
        >
          {/* Left column - Title Section */}
          <div
            className={`${
              currentPreviewMode === "mobile" ? "w-full" : "md:w-2/5 lg:w-1/2"
            } cursor-pointer`}
            onClick={(e) => {
              e.stopPropagation();
              if (
                activeSection !== "faq_title" &&
                activeSection !== "faq_subtitle" &&
                onEditSection
              ) {
                onEditSection("faq_title");
              }
            }}
          >
            <div
              className="relative"
              onMouseEnter={() => setHoveredSection("faq_title")}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <span
                className="font-medium uppercase text-black dark:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeSection !== "faq_title" && onEditSection) {
                    onEditSection("faq_title");
                  }
                }}
              >
                {faqContent.title}
              </span>

              {(hoveredSection === "faq_title" ||
                activeSection === "faq_title") && (
                <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                  FAQ Title (Click to Edit)
                </div>
              )}
            </div>

            <div
              className="relative"
              onMouseEnter={() => setHoveredSection("faq_subtitle")}
              onMouseLeave={() => setHoveredSection(null)}
              onClick={(e) => {
                e.stopPropagation();
                if (activeSection !== "faq_subtitle" && onEditSection) {
                  onEditSection("faq_subtitle");
                }
              }}
            >
              <h2 className="relative mb-6 text-3xl font-bold text-black dark:text-white">
                <span className="relative inline-block">
                  {faqContent.subtitle}
                </span>
              </h2>

              {(hoveredSection === "faq_subtitle" ||
                activeSection === "faq_subtitle") && (
                <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                  FAQ Subtitle (Click to Edit)
                </div>
              )}
            </div>
          </div>

          {/* Right column - FAQ Items */}
          <div
            className={`${
              currentPreviewMode === "mobile" ? "w-full" : "md:w-3/5 lg:w-1/2"
            } cursor-pointer`}
            onClick={(e) => {
              e.stopPropagation();
              if (activeSection !== "faq_items" && onEditSection) {
                onEditSection("faq_items");
              }
            }}
            onMouseEnter={() => setHoveredSection("faq_items")}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <div className="relative rounded-lg bg-white shadow-solid-8 dark:border dark:border-strokedark dark:bg-blacksection">
              {faqContent.items.length > 0 ? (
                faqContent.items.map((faq: FAQItem) => (
                  <FAQItemComponent
                    key={faq.id}
                    faqData={{
                      activeFaq,
                      id: faq.id,
                      handleFaqToggle,
                      question: faq.question,
                      answer: faq.answer,
                    }}
                  />
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No FAQ items added yet. Click to add FAQ items.
                </div>
              )}

              {(hoveredSection === "faq_items" ||
                activeSection === "faq_items") && (
                <>
                  <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
                  <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                    FAQ Items (Click to Edit)
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="rounded-lg border bg-white p-6 dark:bg-black">
      {/* Active section indicator */}
      {activeSection && (
        <div className="mb-3 rounded-md bg-primary/10 p-2 text-center shadow-sm">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
            <span className="text-sm font-medium text-primary">
              {activeSection === "faq_title" ? (
                <span>Editing FAQ Title</span>
              ) : activeSection === "faq_subtitle" ? (
                <span>Editing FAQ Subtitle</span>
              ) : (
                <span>Editing FAQ Items</span>
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
          FAQ Section
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
                    {renderFAQContent()}
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
                    brilian-eka-saetama.com/#faq
                  </span>
                </div>

                {/* Browser icons */}
                <div className="ml-4 flex space-x-2">
                  <div className="h-4 w-4 rounded-full bg-gray-400"></div>
                  <div className="h-4 w-4 rounded-full bg-gray-400"></div>
                </div>
              </div>

              {/* Browser content */}
              <div className="h-[600px] overflow-y-auto overflow-x-hidden bg-white dark:bg-black">
                <div className="origin-top scale-[0.85] pb-10">
                  {renderFAQContent()}
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

export default FAQPreview;
