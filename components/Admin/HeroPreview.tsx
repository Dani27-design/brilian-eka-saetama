"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useLanguage } from "@/app/context/LanguageContext";
import { trimByParentheses } from "@/utils/trimText";
import { HeroVideo } from "../Hero";

// Custom implementation of HeroForm that supports separate editing regions
const EditableHeroForm = ({
  emailPlaceholder,
  buttonText,
  activeSection,
  onEditSection,
  setHoveredSection,
  hoveredSection,
}) => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-5">
      {/* Email Input with square hover ring container */}
      <div
        className={`relative p-1.5 ${
          activeSection === "email_placeholder"
            ? "rounded-sm ring-2 ring-primary/40"
            : "hover:rounded-sm hover:ring-2 hover:ring-primary/40"
        } hover:cursor-pointer`}
        onClick={(e) => {
          e.stopPropagation();
          activeSection !== "email_placeholder" &&
            onEditSection &&
            onEditSection("email_placeholder");
        }}
        onMouseEnter={() => setHoveredSection("email_placeholder")}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="text"
          placeholder={emailPlaceholder}
          className="w-fit rounded-full border border-stroke px-6 py-2.5 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black dark:focus:border-primary"
        />

        {/* Email Placeholder tooltip - positioned directly within its container */}
        {setHoveredSection && hoveredSection === "email_placeholder" && (
          <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white">
            Email Placeholder (Click to Edit)
          </div>
        )}
      </div>

      {/* Button with square hover ring container */}
      <div
        className={`relative p-1.5 ${
          activeSection === "button_text"
            ? "rounded-sm ring-2 ring-primary/40"
            : "hover:rounded-sm hover:ring-2 hover:ring-primary/40"
        } hover:cursor-pointer`}
        onClick={(e) => {
          e.stopPropagation();
          activeSection !== "button_text" &&
            onEditSection &&
            onEditSection("button_text");
        }}
        onMouseEnter={() => setHoveredSection("button_text")}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <button
          aria-label="get started button"
          type="submit"
          className="rounded-full bg-black px-7.5 py-2.5 text-white dark:bg-btndark"
        >
          {buttonText}
        </button>

        {/* Button Text tooltip - positioned directly within its container */}
        {setHoveredSection && hoveredSection === "button_text" && (
          <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white">
            Button Text (Click to Edit)
          </div>
        )}
      </div>
    </form>
  );
};

interface HeroPreviewProps {
  data: {
    [key: string]: {
      [lang: string]: string;
    };
  };
  activeSection: string | null;
  onEditSection?: (section: string) => void;
  previewMode?: "desktop" | "mobile";
  onPreviewModeChange?: (mode: "desktop" | "mobile") => void;
}

const HeroPreview = ({
  data,
  activeSection,
  onEditSection,
  previewMode = "desktop",
  onPreviewModeChange,
}: HeroPreviewProps) => {
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

  // Process the hero data for the current language
  const processHeroData = () => {
    const currentLang = language || "en";

    // Get data for the current language or fallback
    const getValueForLang = (docId) => {
      if (!data[docId]) return "";
      return data[docId][currentLang] || "";
    };

    // Process hero title to extract highlight
    const title = getValueForLang("hero_title");
    let highlight = "";
    let processedTitle = title || "";

    if (title) {
      const parsed = trimByParentheses(title);
      processedTitle = parsed.a;
      highlight = parsed.b;
    }

    return {
      heroTitle: processedTitle,
      highlight,
      heroSubtitle: getValueForLang("hero_subtitle") || "",
      heroSlogan: getValueForLang("hero_slogan") || "",
      emailPlaceholder:
        getValueForLang("email_placeholder") ||
        (currentLang === "id"
          ? "Masukkan alamat email"
          : "Enter email address"),
      buttonText:
        getValueForLang("button_text") ||
        (currentLang === "id" ? "Mari Terhubung" : "Connect with us"),
    };
  };

  const heroContent = processHeroData();

  // Hero content to render inside device frames
  const renderHeroContent = () => (
    <div className="px-auto mx-auto w-full text-sm">
      <div
        className={`flex ${
          currentPreviewMode === "mobile"
            ? "flex-col"
            : "flex-col items-center gap-8 md:flex-row md:items-start lg:gap-12 xl:gap-16"
        }`}
      >
        {/* Hero Content */}
        <div className="w-full text-sm">
          {/* Hero Slogan */}
          <div className="relative">
            <h4
              className={`mb-4.5 font-medium text-black dark:text-white ${
                activeSection === "hero_slogan"
                  ? "relative rounded-sm ring-2 ring-primary/40"
                  : ""
              } hover:cursor-pointer hover:rounded-sm hover:ring-2 hover:ring-primary/40`}
              onClick={(e) => {
                e.stopPropagation();
                activeSection !== "hero_slogan" &&
                  onEditSection &&
                  onEditSection("hero_slogan");
              }}
              onMouseEnter={() => setHoveredSection("hero_slogan")}
              onMouseLeave={() => setHoveredSection(null)}
            >
              {heroContent.heroSlogan}
            </h4>
            {hoveredSection === "hero_slogan" && (
              <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                Hero Slogan (Click to Edit)
              </div>
            )}
          </div>

          {/* Hero Title */}
          <div className="relative">
            <h1
              className={`mb-5 ${
                currentPreviewMode === "mobile" ? "pr-4" : "pr-16"
              } text-xl font-bold text-black dark:text-white ${
                activeSection === "hero_title"
                  ? "relative rounded-sm ring-2 ring-primary/40"
                  : ""
              } hover:cursor-pointer hover:rounded-sm hover:ring-2 hover:ring-primary/40`}
              onClick={(e) => {
                e.stopPropagation();
                activeSection !== "hero_title" &&
                  onEditSection &&
                  onEditSection("hero_title");
              }}
              onMouseEnter={() => setHoveredSection("hero_title")}
              onMouseLeave={() => setHoveredSection(null)}
            >
              {heroContent.heroTitle}
              <span className="relative inline-block pl-2 before:absolute before:bottom-2.5 before:left-0 before:-z-1 before:h-3 before:w-full before:bg-titlebg dark:before:bg-titlebgdark">
                {heroContent.highlight}
              </span>
            </h1>
            {hoveredSection === "hero_title" && (
              <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                Hero Title (Click to Edit)
              </div>
            )}
          </div>

          {/* Hero Subtitle */}
          <div className="relative">
            <p
              className={`text-body-color dark:text-body-color-dark min-h-[60px] max-w-[540px] whitespace-pre-wrap text-sm leading-relaxed ${
                activeSection === "hero_subtitle"
                  ? "relative rounded-sm ring-2 ring-primary/40"
                  : ""
              } hover:cursor-pointer hover:rounded-sm hover:ring-2 hover:ring-primary/40`}
              onClick={(e) => {
                e.stopPropagation();
                activeSection !== "hero_subtitle" &&
                  onEditSection &&
                  onEditSection("hero_subtitle");
              }}
              onMouseEnter={() => setHoveredSection("hero_subtitle")}
              onMouseLeave={() => setHoveredSection(null)}
            >
              {heroContent.heroSubtitle}
            </p>
            {hoveredSection === "hero_subtitle" && (
              <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                Hero Subtitle (Click to Edit)
              </div>
            )}
          </div>

          {/* Email Form - Now split into separate editable components */}
          <div className="mt-5 lg:mt-10 xl:mt-10">
            <div className="relative w-fit">
              <EditableHeroForm
                emailPlaceholder={heroContent.emailPlaceholder}
                buttonText={heroContent.buttonText}
                activeSection={activeSection}
                onEditSection={onEditSection}
                setHoveredSection={setHoveredSection}
                hoveredSection={hoveredSection}
              />
            </div>
          </div>
        </div>

        {/* Hero Media */}
        <div
          className={
            currentPreviewMode === "mobile"
              ? "mt-8 w-full"
              : "w-full p-1 md:w-2/5 lg:w-2/5"
          }
        >
          <div
            className={`relative mx-auto ${
              currentPreviewMode === "mobile"
                ? "max-w-[100%]"
                : "max-w-[420px] 2xl:-mr-7.5"
            }`}
          >
            <Image
              src="/images/shape/shape-01.png"
              alt="shape"
              width={46}
              height={246}
              className="absolute -left-11.5 top-0"
              priority={false}
              quality={50}
            />
            <Image
              src="/images/shape/shape-02.svg"
              alt="shape"
              width={36.9}
              height={36.7}
              className="absolute bottom-0 right-0 z-10"
              priority={false}
              quality={50}
            />
            <Image
              src="/images/shape/shape-03.svg"
              alt="shape"
              width={21.64}
              height={21.66}
              className="absolute -right-6.5 bottom-0 z-1"
              priority={false}
              quality={50}
            />
            <HeroVideo />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-lg border bg-white p-6 dark:bg-black">
      {/* Editing Status Indicator */}
      {activeSection && (
        <div className="mb-3 rounded-md bg-primary/10 p-2 text-center shadow-sm">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
            <span className="text-sm font-medium text-primary">
              {activeSection === "hero_title" ? (
                <span>Editing Title</span>
              ) : activeSection === "hero_subtitle" ? (
                <span>Editing Subtitle</span>
              ) : activeSection === "hero_slogan" ? (
                <span>Editing Slogan</span>
              ) : activeSection === "email_placeholder" ? (
                <span>Editing Email Placeholder</span>
              ) : (
                <span>Editing Button Text</span>
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
          Hero Section
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
      <div className="mx-auto w-full">
        {currentPreviewMode === "mobile" ? (
          /* Mobile Phone Mockup */
          <div className="mx-auto w-[350px]">
            <div className="relative overflow-hidden rounded-[36px] border-[14px] border-gray-900 bg-gray-900 shadow-xl">
              {/* Phone "notch" */}
              <div className="absolute left-1/2 top-0 z-10 h-6 w-40 -translate-x-1/2 rounded-b-lg bg-gray-900"></div>

              {/* Phone screen frame */}
              <div className="relative h-[650px] w-full overflow-hidden bg-white">
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
                  <div className="origin-top scale-[0.85] pb-12 pt-6">
                    {renderHeroContent()}
                  </div>
                </div>
              </div>

              {/* Home indicator */}
              <div className="absolute bottom-1 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-gray-300"></div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              Mobile Preview • Scroll to see more content{"\n"}Hover over and
              click on any section to edit its content.
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
                    brilian-eka-saetama.com
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
                <div className="origin-top scale-100 px-5 pb-5 pt-6">
                  {renderHeroContent()}
                </div>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              Desktop Preview • Scroll to see more content{"\n"}Hover over and
              click on any section to edit its content.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroPreview;
