"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useLanguage } from "@/app/context/LanguageContext";

interface ServicePreviewProps {
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

const ServicePreview = ({
  data,
  activeSection,
  onEditSection,
  previewMode = "desktop",
  onPreviewModeChange,
}: ServicePreviewProps) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [internalPreviewMode, setInternalPreviewMode] = useState<
    "desktop" | "mobile"
  >(previewMode);

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

  // Process the services data for the current language
  const processServicesData = () => {
    const currentLang = language || "en";

    // Get services title
    const getServicesTitle = () => {
      if (!data.services_title || !data.services_title[currentLang]) {
        return currentLang === "en" ? "Our Services" : "Layanan Kami";
      }
      return data.services_title[currentLang];
    };

    // Get services subtitle
    const getServicesSubtitle = () => {
      if (!data.services_subtitle || !data.services_subtitle[currentLang]) {
        return currentLang === "en"
          ? "Discover our comprehensive range of services"
          : "Temukan berbagai layanan komprehensif kami";
      }
      return data.services_subtitle[currentLang];
    };

    // Get services data
    const getServicesData = () => {
      try {
        if (!data.services_data || !data.services_data[currentLang]) return [];
        const items = data.services_data[currentLang];
        return Array.isArray(items) ? items : [];
      } catch (e) {
        console.error("Error parsing services data:", e);
        return [];
      }
    };

    const servicesTitle = getServicesTitle();
    const servicesSubtitle = getServicesSubtitle();
    const servicesData = getServicesData();

    return {
      servicesTitle,
      servicesSubtitle,
      servicesData,
    };
  };

  const servicesContent = processServicesData();

  // Determine classes based on preview mode
  const getServiceCardsContainerClasses = () => {
    if (currentPreviewMode === "mobile") {
      // Mobile view: single column, smaller spacing
      return "mt-8 grid grid-cols-1 gap-6";
    } else {
      // Desktop view: multi-column, larger spacing
      return "mt-12 grid grid-cols-3 gap-10";
    }
  };

  // Render services content for device frames
  const renderServicesContent = () => (
    <div className="mx-auto w-full py-4">
      {/* Section Header with Title and Subtitle */}
      <div className="mx-auto text-center">
        <div className="mb-4 inline-block rounded-full bg-zumthor px-4.5 py-1.5 dark:border dark:border-strokedark dark:bg-blacksection">
          <span className="text-sectiontitle font-medium text-black dark:text-white">
            {language === "en" ? "Our Services" : "Layanan Kami"}
          </span>
        </div>
        <div
          className="relative mb-4 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            activeSection !== "services_title" &&
              onEditSection &&
              onEditSection("services_title");
          }}
          onMouseEnter={() => setHoveredSection("services_title")}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <h2
            className={`mb-4 font-bold text-black dark:text-white ${
              currentPreviewMode === "mobile" ? "text-xl" : "text-2xl"
            }`}
          >
            {servicesContent.servicesTitle}
          </h2>

          {(hoveredSection === "services_title" ||
            activeSection === "services_title") && (
            <>
              <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
              <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                Services Title (Click to Edit)
              </div>
            </>
          )}
        </div>

        <div
          className="relative mb-10 w-full cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            activeSection !== "services_subtitle" &&
              onEditSection &&
              onEditSection("services_subtitle");
          }}
          onMouseEnter={() => setHoveredSection("services_subtitle")}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <p
            className={`text-body-color mx-auto font-medium leading-relaxed ${
              currentPreviewMode === "mobile"
                ? "w-full text-sm"
                : "max-w-c-665 text-base"
            }`}
          >
            {servicesContent.servicesSubtitle}
          </p>

          {(hoveredSection === "services_subtitle" ||
            activeSection === "services_subtitle") && (
            <>
              <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
              <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                Services Subtitle (Click to Edit)
              </div>
            </>
          )}
        </div>
      </div>

      {/* Services Cards Grid */}
      <div
        className={`relative cursor-pointer ${getServiceCardsContainerClasses()}`}
        onClick={(e) => {
          e.stopPropagation();
          activeSection !== "services_data" &&
            onEditSection &&
            onEditSection("services_data");
        }}
        onMouseEnter={() => setHoveredSection("services_data")}
        onMouseLeave={() => setHoveredSection(null)}
      >
        {servicesContent.servicesData.map((service, index) => (
          <div
            key={index}
            className="z-40 flex h-full flex-col rounded-lg border border-white bg-white p-6 shadow-solid-3 transition-all hover:shadow-solid-4 dark:border-strokedark dark:bg-blacksection dark:hover:bg-hoverdark"
          >
            <div
              className={`relative mb-6 w-full overflow-hidden rounded-lg ${
                currentPreviewMode === "mobile" ? "h-[160px]" : "h-[230px]"
              }`}
            >
              <Image
                src={service.image || "/images/service-placeholder.jpg"}
                alt={service.title || "Service"}
                fill
                sizes={
                  currentPreviewMode === "mobile"
                    ? "100vw"
                    : "(max-width: 1200px) 33vw, 33vw"
                }
                className="object-cover"
                style={{
                  objectFit: "cover",
                  objectPosition: "center",
                }}
              />
            </div>
            <h3
              className={`mb-3 font-semibold text-black dark:text-white ${
                currentPreviewMode === "mobile" ? "text-lg" : "text-xl"
              }`}
            >
              {service.title || "Service Title"}
            </h3>
            <p
              className={`flex-grow ${
                currentPreviewMode === "mobile" ? "text-sm" : ""
              }`}
            >
              {service.description || "Service description goes here."}
            </p>
          </div>
        ))}

        {/* Show placeholder card if no services */}
        {servicesContent.servicesData.length === 0 && (
          <div className="z-40 flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <span className="mb-3 text-3xl">➕</span>
            <p>Add services to display here</p>
          </div>
        )}

        {(hoveredSection === "services_data" ||
          activeSection === "services_data") && (
          <>
            <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
            <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
              Services Data (Click to Edit)
            </div>
          </>
        )}
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
              {activeSection === "services_title" ? (
                <span>Editing Title</span>
              ) : activeSection === "services_subtitle" ? (
                <span>Editing Subtitle</span>
              ) : (
                <span>Editing Service Lists</span>
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
          Services Section
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
                    {renderServicesContent()}
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
                    brilian-eka-saetama.com/#services
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
                  {renderServicesContent()}
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

export default ServicePreview;
