"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useLanguage } from "@/app/context/LanguageContext";

interface ClientsPreviewProps {
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

const ClientsPreview = ({
  data,
  activeSection,
  onEditSection,
  previewMode = "desktop",
  onPreviewModeChange,
}: ClientsPreviewProps) => {
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

  // Process the clients data for the current language
  const processClientsData = () => {
    const currentLang = language || "en";

    // Get clients data
    const getClientsData = () => {
      if (!data.clients_data || !data.clients_data[currentLang]) {
        return {
          title:
            currentLang === "en"
              ? "Trusted by Global Companies"
              : "Dipercaya oleh Perusahaan Global",
          description:
            currentLang === "en"
              ? "Our company has been delivering high-quality services to clients worldwide."
              : "Perusahaan kami telah memberikan layanan berkualitas tinggi kepada klien di seluruh dunia.",
          stats: [
            {
              id: 1,
              value: "40K+",
              label: currentLang === "en" ? "Happy Clients" : "Klien Bahagia",
            },
            {
              id: 2,
              value: "50+",
              label: currentLang === "en" ? "Global Partners" : "Mitra Global",
            },
            {
              id: 3,
              value: "98%",
              label:
                currentLang === "en" ? "Success Rate" : "Tingkat Keberhasilan",
            },
          ],
        };
      }
      return data.clients_data[currentLang];
    };

    // Get clients background images
    const getClientsBackground = () => {
      if (!data.clients_background || !data.clients_background[currentLang]) {
        return {
          light: "",
          dark: "",
        };
      }
      const bgData = data.clients_background[currentLang];
      return {
        light: bgData.light || "",
        dark: bgData.dark || "",
      };
    };

    const clientsData = getClientsData();
    const bgImages = getClientsBackground();

    return {
      clientsData,
      backgroundLight: bgImages.light,
      backgroundDark: bgImages.dark,
    };
  };

  const clientsContent = processClientsData();

  // Render clients content for device frames
  const renderClientsContent = () => (
    <div className="mx-auto w-full py-10 text-sm">
      <div className="relative z-1 mx-auto max-w-c-1280 rounded-lg bg-gradient-to-t from-[#F8F9FF] to-[#DEE7FF] py-12 dark:bg-blacksection dark:bg-gradient-to-t dark:from-transparent dark:to-transparent dark:stroke-strokedark">
        {/* Left Background Shape */}
        <Image
          width={305}
          height={354}
          src="/images/shape/shape-04.png"
          alt="Shape"
          className="absolute -left-4 -top-10 -z-1 dark:hidden"
          quality={50}
        />

        {/* Right Bottom Shape */}
        <Image
          width={102}
          height={102}
          src="/images/shape/shape-05.png"
          alt="Doodle"
          className="absolute bottom-0 right-0 -z-1"
          quality={50}
        />

        <Image
          fill
          src="/images/shape/shape-dotted-light-02.svg"
          alt="Dotted"
          priority={false}
          quality={50}
          loading="lazy" // Changed from eager since we're loading client-side
          className="absolute left-0 top-0 -z-1 dark:hidden"
          decoding="async"
          sizes="100vw"
          style={{
            objectFit: "contain",
            objectPosition: "center",
          }}
        />
        <Image
          fill
          src="/images/shape/shape-dotted-dark-02.svg"
          alt="Dotted"
          priority={false}
          quality={50}
          loading="lazy" // Changed from eager since we're loading client-side
          className="absolute left-0 top-0 -z-1 hidden dark:block"
          decoding="async"
          sizes="100vw"
          style={{
            objectFit: "contain",
            objectPosition: "center",
          }}
        />

        {/* Clients Content */}
        <div
          className="relative mx-auto cursor-pointer px-4 text-center"
          onClick={(e) => {
            e.stopPropagation();
            activeSection !== "clients_data" &&
              onEditSection &&
              onEditSection("clients_data");
          }}
          onMouseEnter={() => setHoveredSection("clients_data")}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <div
            className={
              currentPreviewMode === "mobile"
                ? "w-full"
                : "mx-auto md:w-4/5 lg:w-2/3"
            }
          >
            <h2
              className={`mb-4 font-bold text-black dark:text-white ${
                currentPreviewMode === "mobile" ? "text-xl" : "text-xl"
              }`}
            >
              {clientsContent.clientsData.title}
            </h2>
            <p
              className={`${
                currentPreviewMode === "mobile" ? "" : "mx-auto lg:w-11/12"
              }`}
            >
              {clientsContent.clientsData.description}
            </p>

            {/* Stats Display */}
            <div className="mt-8 flex flex-wrap justify-center gap-8">
              {clientsContent.clientsData.stats?.map((stat) => (
                <div key={stat.id} className="text-center">
                  <h4 className="mb-2.5 text-xl font-bold text-black dark:text-white">
                    {stat.value}
                  </h4>
                  <p
                    className={
                      currentPreviewMode === "mobile" ? "text-base" : "text-lg"
                    }
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {(hoveredSection === "clients_data" ||
              activeSection === "clients_data") && (
              <>
                <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
                <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                  Clients Data (Click to Edit)
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
              {activeSection === "clients_data" ? (
                <span>Editing Clients Content</span>
              ) : (
                <span>Editing Background Images</span>
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
          Client Satisfaction Section
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
                    {renderClientsContent()}
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
                    brilian-eka-saetama.com/#clients
                  </span>
                </div>

                {/* Browser icons */}
                <div className="ml-4 flex space-x-2">
                  <div className="h-4 w-4 rounded-full bg-gray-400"></div>
                  <div className="h-4 w-4 rounded-full bg-gray-400"></div>
                </div>
              </div>

              {/* Browser content */}
              <div className="h-fit max-h-[600px] min-h-[200px] overflow-y-auto overflow-x-hidden bg-white dark:bg-black">
                <div className="origin-top scale-[0.85] pb-5">
                  {renderClientsContent()}
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

export default ClientsPreview;
