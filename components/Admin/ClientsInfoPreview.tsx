"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useLanguage } from "@/app/context/LanguageContext";

interface Brand {
  id: number;
  name: string;
  href: string;
  image: string;
  imageLight?: string;
}

interface ClientsInfoPreviewProps {
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

const ClientsInfoPreview = ({
  data,
  activeSection,
  onEditSection,
  previewMode = "desktop",
  onPreviewModeChange,
}: ClientsInfoPreviewProps) => {
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

  // Process the clients info data for the current language
  const processClientsInfoData = () => {
    const currentLang = language || "en";

    // Get clients data
    const getClientsData = () => {
      if (!data.clients || !data.clients[currentLang]) {
        // Default sample data if none exists
        return [
          {
            id: 1,
            name: "Brand One",
            href: "#",
            image: "/images/brands/brand-01.svg",
            imageLight: "/images/brands/brand-01-light.svg",
          },
          {
            id: 2,
            name: "Brand Two",
            href: "#",
            image: "/images/brands/brand-02.svg",
            imageLight: "/images/brands/brand-02-light.svg",
          },
          {
            id: 3,
            name: "Brand Three",
            href: "#",
            image: "/images/brands/brand-03.svg",
            imageLight: "/images/brands/brand-03-light.svg",
          },
          {
            id: 4,
            name: "Brand Four",
            href: "#",
            image: "/images/brands/brand-04.svg",
            imageLight: "/images/brands/brand-04-light.svg",
          },
          {
            id: 5,
            name: "Brand Five",
            href: "#",
            image: "/images/brands/brand-05.svg",
            imageLight: "/images/brands/brand-05-light.svg",
          },
          {
            id: 6,
            name: "Brand Six",
            href: "#",
            image: "/images/brands/brand-06.svg",
            imageLight: "/images/brands/brand-06-light.svg",
          },
        ];
      }

      return data.clients[currentLang];
    };

    const clientsData = getClientsData();

    return {
      brands: clientsData,
    };
  };

  const clientsContent = processClientsInfoData();

  // Render clients info content for device frames
  const renderClientsInfoContent = () => (
    <div
      className={`mx-auto w-full border border-x-0 border-y-stroke bg-alabaster py-10 dark:border-y-strokedark dark:bg-black`}
    >
      <div className="mx-auto px-2">
        <div
          className="relative cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            activeSection !== "clients" &&
              onEditSection &&
              onEditSection("clients");
          }}
          onMouseEnter={() => setHoveredSection("clients")}
          onMouseLeave={() => setHoveredSection(null)}
        >
          {/* Clients brands grid */}
          <div
            className={
              currentPreviewMode === "mobile"
                ? "grid grid-cols-3 items-start justify-center gap-4"
                : "grid grid-cols-3 items-start justify-center gap-5 md:grid-cols-6 lg:gap-8"
            }
          >
            {clientsContent.brands.map((brand: Brand) => (
              <div
                key={brand.id}
                className="flex h-[170px] w-full max-w-[120px] flex-col items-center justify-start gap-2"
              >
                <div className="flex h-[120px] w-[98px] items-center justify-center overflow-hidden rounded-lg">
                  <div className="relative h-full w-full rounded-lg shadow-lg">
                    <Image
                      className="rounded-lg opacity-50 shadow-lg transition-all duration-300 hover:opacity-100"
                      src={brand.imageLight || brand.image}
                      alt={brand.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 98px"
                      style={{ objectFit: "cover", objectPosition: "center" }}
                      quality={50}
                    />
                  </div>
                </div>
                <div className="mt-2 h-[40px] w-full overflow-hidden text-center">
                  <p className="mx-auto line-clamp-2 max-w-full whitespace-normal px-1 text-sm leading-tight">
                    {brand.name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {(hoveredSection === "clients" || activeSection === "clients") && (
            <>
              <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
              <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                Client Brands (Click to Edit)
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
              Editing Client Brands
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Click to edit client brands information
          </p>
        </div>
      )}

      {/* Preview mode toggle buttons */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-black dark:text-white">
          Client List Section
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
                    {renderClientsInfoContent()}
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
                    brilian-eka-saetama.com/#clients-info
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
                  {renderClientsInfoContent()}
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

export default ClientsInfoPreview;
