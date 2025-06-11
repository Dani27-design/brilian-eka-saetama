"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useLanguage } from "@/app/context/LanguageContext";

interface AboutPreviewProps {
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

const AboutPreview = ({
  data,
  activeSection,
  onEditSection,
  previewMode = "desktop",
  onPreviewModeChange,
}: AboutPreviewProps) => {
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

  // Process the about data for the current language
  const processAboutData = () => {
    const currentLang = language || "id";

    // Get about title
    const getAboutTitle = () => {
      if (!data.about_title || !data.about_title[currentLang]) {
        return currentLang === "en" ? "About Us" : "Tentang Kami";
      }
      return data.about_title[currentLang];
    };

    // Get about subtitle
    const getAboutSubtitle = () => {
      if (!data.about_subtitle || !data.about_subtitle[currentLang]) {
        return currentLang === "en"
          ? "Learn more about our company"
          : "Pelajari lebih lanjut tentang perusahaan kami";
      }
      return data.about_subtitle[currentLang];
    };

    // Get about sections
    const getAboutSections = () => {
      try {
        if (!data.about_sections || !data.about_sections[currentLang])
          return [];
        const sections = data.about_sections[currentLang];
        return Array.isArray(sections) ? sections : [];
      } catch (e) {
        console.error("Error parsing about sections:", e);
        return [];
      }
    };

    const aboutTitle = getAboutTitle();
    const aboutSubtitle = getAboutSubtitle();
    const aboutSections = getAboutSections();

    return {
      aboutTitle,
      aboutSubtitle,
      aboutSections,
    };
  };

  const aboutContent = processAboutData();

  // Render about content for device frames
  const renderAboutContent = () => (
    <div className="mx-auto w-full py-4">
      <div className="mx-auto w-full px-0">
        {/* Section Header with Title and Subtitle */}
        <div className="mx-auto text-center">
          <div className="mb-4 inline-block rounded-full bg-zumthor px-4.5 py-1.5 dark:border dark:border-strokedark dark:bg-blacksection">
            <span className="text-sectiontitle font-medium text-black dark:text-white">
              {language === "en" ? "About Us" : "Tentang Kami"}
            </span>
          </div>
          <div
            className="relative mb-4 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              activeSection !== "about_title" &&
                onEditSection &&
                onEditSection("about_title");
            }}
            onMouseEnter={() => setHoveredSection("about_title")}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <h2
              className={`mb-4 font-bold text-black dark:text-white ${
                currentPreviewMode === "mobile" ? "text-xl" : "text-2xl"
              }`}
            >
              {aboutContent.aboutTitle}
            </h2>

            {(hoveredSection === "about_title" ||
              activeSection === "about_title") && (
              <>
                <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
                <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                  About Title (Click to Edit)
                </div>
              </>
            )}
          </div>

          <div
            className="relative mb-10 w-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              activeSection !== "about_subtitle" &&
                onEditSection &&
                onEditSection("about_subtitle");
            }}
            onMouseEnter={() => setHoveredSection("about_subtitle")}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <p
              className={`text-body-color mx-auto font-medium leading-relaxed ${
                currentPreviewMode === "mobile"
                  ? "w-full text-sm"
                  : "max-w-c-665 text-base"
              }`}
            >
              {aboutContent.aboutSubtitle}
            </p>

            {(hoveredSection === "about_subtitle" ||
              activeSection === "about_subtitle") && (
              <>
                <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
                <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                  About Subtitle (Click to Edit)
                </div>
              </>
            )}
          </div>
        </div>

        {/* About Sections */}
        <div
          className="relative cursor-pointer text-sm"
          onClick={(e) => {
            e.stopPropagation();
            activeSection !== "about_sections" &&
              onEditSection &&
              onEditSection("about_sections");
          }}
          onMouseEnter={() => setHoveredSection("about_sections")}
          onMouseLeave={() => setHoveredSection(null)}
        >
          {aboutContent.aboutSections.length > 0 ? (
            aboutContent.aboutSections.map((section, index) => {
              // Alternate layout based on even/odd index
              if (index % 2 === 0) {
                // Even sections (0, 2, 4...)
                return (
                  <div
                    key={section.id || index}
                    className={`mt-12.5 flex flex-wrap items-center gap-8 ${
                      currentPreviewMode === "mobile"
                        ? "flex-col"
                        : "md:flex-row-reverse lg:gap-32.5"
                    }`}
                  >
                    {/* Image for even sections */}
                    <div
                      className={`relative order-2 mx-auto ${
                        currentPreviewMode === "mobile"
                          ? "w-full"
                          : "md:order-1 md:w-1/3"
                      }`}
                    >
                      <div className="relative aspect-square w-full">
                        <Image
                          src={
                            section.lightImage ||
                            "/images/about/placeholder-light.jpg"
                          }
                          alt={section.title || "About"}
                          className="rounded-lg object-cover dark:hidden"
                          fill
                          quality={50}
                        />
                        <Image
                          src={
                            section.darkImage ||
                            "/images/about/placeholder-dark.jpg"
                          }
                          alt={section.title || "About"}
                          className="hidden rounded-lg object-cover dark:block"
                          fill
                          quality={50}
                        />
                      </div>
                    </div>

                    {/* Content for even sections */}
                    <div
                      className={`animate_right ${
                        currentPreviewMode === "mobile" ? "w-full" : "md:w-1/2"
                      }`}
                    >
                      <h4 className="font-medium uppercase text-black dark:text-white">
                        {section.title || "Section Title"}
                      </h4>
                      <h2 className="relative mb-6 text-xl font-bold text-black dark:text-white">
                        {section.subtitle || "Section Subtitle"}
                      </h2>
                      <p>
                        {section.description ||
                          "Section description goes here."}
                      </p>

                      {section.points && section.points.length > 0 && (
                        <div className="mt-7.5 space-y-7.5">
                          {section.points.map((point) => (
                            <div
                              key={point.id}
                              className="flex items-center gap-5"
                            >
                              <div className="flex h-15 w-15 items-center justify-center rounded-full border border-stroke dark:border-strokedark dark:bg-blacksection">
                                <p className="text-metatitle1 font-semibold text-black dark:text-white">
                                  {point.number || "1"}
                                </p>
                              </div>
                              <div className="w-3/4">
                                <h4 className="text-metatitle1 mb-0.5 text-black dark:text-white">
                                  {point.title || "Point Title"}
                                </h4>
                                <p>
                                  {point.description || "Point description"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              } else {
                // Odd sections (1, 3, 5...)
                return (
                  <div
                    key={section.id || index}
                    className={`mt-12.5 flex flex-wrap items-center gap-8 ${
                      currentPreviewMode === "mobile"
                        ? "flex-col"
                        : "lg:gap-32.5"
                    }`}
                  >
                    {/* Image for odd sections */}
                    <div
                      className={`relative order-2 mx-auto ${
                        currentPreviewMode === "mobile"
                          ? "w-full"
                          : "md:order-1 md:w-1/3"
                      }`}
                    >
                      <div className="relative aspect-square w-full">
                        <Image
                          src={
                            section.lightImage ||
                            "/images/about/placeholder-light.jpg"
                          }
                          alt={section.title || "About"}
                          className="rounded-lg object-cover dark:hidden"
                          fill
                          quality={50}
                        />
                        <Image
                          src={
                            section.darkImage ||
                            "/images/about/placeholder-dark.jpg"
                          }
                          alt={section.title || "About"}
                          className="hidden rounded-lg object-cover dark:block"
                          fill
                          quality={50}
                        />
                      </div>
                    </div>

                    {/* Content for odd sections */}
                    <div
                      className={`animate_left ${
                        currentPreviewMode === "mobile" ? "w-full" : "md:w-1/2"
                      }`}
                    >
                      <h4 className="font-medium uppercase text-black dark:text-white">
                        {section.title || "Section Title"}
                      </h4>
                      <h2 className="relative mb-6 text-xl font-bold text-black dark:text-white">
                        {section.subtitle || "Section Subtitle"}
                      </h2>
                      <p>
                        {section.description ||
                          "Section description goes here."}
                      </p>

                      {section.points && section.points.length > 0 && (
                        <div className="mt-7.5 space-y-7.5">
                          {section.points.map((point) => (
                            <div
                              key={point.id}
                              className="flex items-center gap-5"
                            >
                              <div className="flex h-15 w-15 items-center justify-center rounded-full border border-stroke dark:border-strokedark dark:bg-blacksection">
                                <p className="text-metatitle1 font-semibold text-black dark:text-white">
                                  {point.number || "1"}
                                </p>
                              </div>
                              <div className="w-3/4">
                                <h4 className="text-metatitle1 mb-0.5 text-black dark:text-white">
                                  {point.title || "Point Title"}
                                </h4>
                                <p>
                                  {point.description || "Point description"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            })
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <span className="mb-3 text-3xl">➕</span>
              <p>Add about sections to display here</p>
            </div>
          )}

          {(hoveredSection === "about_sections" ||
            activeSection === "about_sections") && (
            <>
              <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
              <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                About Sections (Click to Edit)
              </div>
            </>
          )}
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
              {activeSection === "about_title" ? (
                <span>Editing Title</span>
              ) : activeSection === "about_subtitle" ? (
                <span>Editing Subtitle</span>
              ) : (
                <span>Editing About Sections</span>
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
          About Section
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
                    {renderAboutContent()}
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
                    brilian-eka-saetama.com/#aboutus
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
                  {renderAboutContent()}
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

export default AboutPreview;
