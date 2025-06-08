"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useLanguage } from "@/app/context/LanguageContext";

interface HeaderPreviewProps {
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

const HeaderPreview = ({
  data,
  activeSection,
  onEditSection,
  previewMode = "desktop",
  onPreviewModeChange,
}: HeaderPreviewProps) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [internalPreviewMode, setInternalPreviewMode] = useState<
    "desktop" | "mobile"
  >(previewMode);
  const [navigationOpen, setNavigationOpen] = useState<boolean>(false);
  const [dropdownToggler, setDropdownToggler] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Process the header data for the current language
  const processHeaderData = () => {
    const currentLang = language || "en";

    // Get menu items
    const getMenuItems = () => {
      try {
        if (!data.menu_items || !data.menu_items[currentLang]) return [];
        const items = data.menu_items[currentLang];
        return Array.isArray(items) ? items : [];
      } catch (e) {
        console.error("Error parsing menu items:", e);
        return [];
      }
    };

    // Get logo data
    const getLogoData = () => {
      if (!data.logo_data || !data.logo_data[currentLang]) {
        return {
          light: "/images/logo/logo-light.png",
          dark: "/images/logo/logo-dark.png",
        };
      }

      const logoData = data.logo_data[currentLang];
      return {
        light: logoData.light || "/images/logo/logo-light.png",
        dark: logoData.dark || "/images/logo/logo-dark.png",
      };
    };

    // Get language dropdown data
    const getLangDropdownData = () => {
      if (!data.language_dropdown || !data.language_dropdown[currentLang]) {
        return {
          en_text: "🇬🇧 English",
          id_text: "🇮🇩 Indonesia",
        };
      }

      const langData = data.language_dropdown[currentLang];
      return {
        en_text: langData.en_text || "🇬🇧 English",
        id_text: langData.id_text || "🇮🇩 Indonesia",
      };
    };

    const menuItems = getMenuItems();
    const logoData = getLogoData();
    const langDropdownData = getLangDropdownData();

    return {
      menuItems,
      logoLight: logoData.light,
      logoDark: logoData.dark,
      enText: langDropdownData.en_text,
      idText: langDropdownData.id_text,
    };
  };

  const headerContent = processHeaderData();

  // Render header content for device frames
  const renderHeaderContent = () => (
    <div
      className={`w-full px-0 py-2 text-sm ${
        theme === "dark" ? "bg-blacksection" : "bg-white"
      } shadow-lg`}
    >
      <div
        className={`relative flex w-full items-center justify-between px-2 ${
          currentPreviewMode === "mobile" ? "flex-col" : ""
        }`}
      >
        <div
          className={`flex flex-row items-center justify-between ${
            currentPreviewMode === "mobile" ? "w-full" : "mr-5 w-auto"
          }`}
        >
          {/* Logo with editable region */}
          <div
            className="relative w-fit hover:cursor-pointer hover:rounded-sm hover:p-1 hover:ring-2 hover:ring-primary/40"
            onClick={(e) => {
              e.stopPropagation();
              activeSection !== "logo_data" &&
                onEditSection &&
                onEditSection("logo_data");
            }}
            onMouseEnter={() => setHoveredSection("logo_data")}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <Image
              src={headerContent.logoLight}
              alt="logo"
              width={35}
              height={34}
              className="dark:hidden"
              style={{
                cursor: "pointer",
                width: "auto",
                height: "auto",
              }}
              quality={50}
            />
            <Image
              src={headerContent.logoDark}
              alt="logo"
              width={35}
              height={34}
              className="hidden dark:block"
              style={{
                cursor: "pointer",
                width: "auto",
                height: "auto",
              }}
              quality={50}
            />
            {hoveredSection === "logo_data" && (
              <div className="-bottom-100 absolute left-0 z-10 w-fit rounded bg-black/80 px-2 py-1 text-xs text-white">
                Logo (Click to Edit)
              </div>
            )}
          </div>
          {/* Hamburger toggle button (only for mobile preview) */}
          {currentPreviewMode === "mobile" && (
            <button
              aria-label="hamburger Toggler"
              className="block" // Removed xl:hidden as it won't work in preview
              onClick={() => setNavigationOpen(!navigationOpen)}
            >
              <span className="relative block h-5.5 w-5.5 cursor-pointer">
                <span className="absolute right-0 block h-full w-full">
                  <span
                    className={`relative left-0 top-0 my-1 block h-0.5 rounded-sm bg-black delay-[0] duration-200 ease-in-out dark:bg-white ${
                      !navigationOpen ? "!w-full delay-300" : "w-0"
                    }`}
                  ></span>
                  <span
                    className={`relative left-0 top-0 my-1 block h-0.5 rounded-sm bg-black delay-150 duration-200 ease-in-out dark:bg-white ${
                      !navigationOpen ? "delay-400 !w-full" : "w-0"
                    }`}
                  ></span>
                  <span
                    className={`relative left-0 top-0 my-1 block h-0.5 rounded-sm bg-black delay-200 duration-200 ease-in-out dark:bg-white ${
                      !navigationOpen ? "!w-full delay-500" : "w-0"
                    }`}
                  ></span>
                </span>
                <span className="du-block absolute right-0 h-full w-full rotate-45">
                  <span
                    className={`absolute left-2.5 top-0 block h-full w-0.5 rounded-sm bg-black delay-300 duration-200 ease-in-out dark:bg-white ${
                      !navigationOpen ? "!h-0 delay-[0]" : "h-full"
                    }`}
                  ></span>
                  <span
                    className={`delay-400 absolute left-0 top-2.5 block h-0.5 w-full rounded-sm bg-black duration-200 ease-in-out dark:bg-white ${
                      !navigationOpen ? "!h-0 delay-200" : "h-0.5"
                    }`}
                  ></span>
                </span>
              </span>
            </button>
          )}
        </div>

        {/* Nav Menu - Editable */}
        <div
          className={`${
            // Instead of using xl:visible xl:flex, we use currentPreviewMode
            currentPreviewMode === "desktop"
              ? "flex h-auto w-full flex-row items-center justify-between"
              : navigationOpen
              ? "mt-4 flex h-auto max-h-[400px] w-full flex-col rounded-md bg-white p-7.5 shadow-solid-5 dark:bg-blacksection"
              : "invisible h-0 w-0"
          }`}
        >
          <nav className="relative w-fit">
            <ul
              className={`flex gap-5 hover:cursor-pointer hover:rounded-sm hover:p-1 hover:ring-2 hover:ring-primary/40 ${
                currentPreviewMode === "desktop"
                  ? "flex-row items-center gap-10"
                  : "flex-col items-start gap-4"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                activeSection !== "menu_items" &&
                  onEditSection &&
                  onEditSection("menu_items");
              }}
              onMouseEnter={() => setHoveredSection("menu_items")}
              onMouseLeave={() => setHoveredSection(null)}
            >
              {/* Menu Items - Editable */}
              {headerContent.menuItems.map((menuItem, key) => (
                <li key={key} className={menuItem.submenu && "group relative"}>
                  {menuItem.submenu ? (
                    <>
                      <button
                        onClick={() => setDropdownToggler(!dropdownToggler)}
                        className="flex cursor-pointer items-center justify-between gap-3 hover:text-primary"
                      >
                        {menuItem.title}
                        <span>
                          <svg
                            className="h-3 w-3 cursor-pointer fill-waterloo group-hover:fill-primary"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 512 512"
                          >
                            <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
                          </svg>
                        </span>
                      </button>

                      <ul
                        className={`dropdown ${dropdownToggler ? "flex" : ""}`}
                      >
                        {menuItem.submenu.map((item, key) => (
                          <li key={key} className="hover:text-primary">
                            <a href={item.path || "#"}>{item.title}</a>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : menuItem?.path?.startsWith("#") ? (
                    <p className="hover:text-primary">{menuItem.title}</p>
                  ) : (
                    <p className="hover:text-primary">{menuItem.title}</p>
                  )}
                </li>
              ))}
            </ul>
            {hoveredSection === "menu_items" && (
              <div className="top-100 absolute left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                Menu Items (Click to Edit)
              </div>
            )}
          </nav>

          <div
            className={`${
              currentPreviewMode === "desktop" ? "mt-0" : "mt-7"
            } flex items-center gap-6`}
          >
            {/* Theme Toggler */}
            <button
              aria-label="theme toggler"
              disabled={true}
              className="flex h-fit w-fit items-center justify-center rounded-full bg-gray-200 p-1 dark:bg-gray-700"
            >
              <Image
                src="/images/icon/icon-moon.svg"
                alt="logo"
                width={16}
                height={16}
                className="dark:hidden"
                priority={true}
                quality={50}
              />

              <Image
                src="/images/icon/icon-sun.svg"
                alt="logo"
                width={17}
                height={17}
                className="hidden dark:block"
                priority={true}
                quality={50}
              />
            </button>

            {/* Language Dropdown - Editable */}
            <div
              className="relative inline-block text-left text-sm hover:cursor-pointer hover:rounded-sm hover:p-1 hover:ring-2 hover:ring-primary/40"
              onMouseEnter={() => setHoveredSection("language_dropdown")}
              onMouseLeave={() => setHoveredSection(null)}
              onClick={(e) => {
                e.stopPropagation();
                activeSection !== "language_dropdown" &&
                  onEditSection &&
                  onEditSection("language_dropdown");
              }}
            >
              <div>
                <button
                  onClick={toggleDropdown}
                  type="button"
                  className="flex items-center justify-center rounded-full bg-primary px-2.5 py-2 text-sm text-white duration-300 ease-in-out hover:bg-primary focus:outline-none"
                  aria-expanded={isOpen}
                >
                  {language === "en"
                    ? headerContent.enText
                    : headerContent.idText}
                </button>
                {hoveredSection === "language_dropdown" && (
                  <div className="bottom-100 absolute left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                    Language Dropdown (Click to Edit)
                  </div>
                )}
              </div>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div
                    className="py-1"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="options-menu"
                  >
                    <button className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                      {headerContent.idText}
                    </button>
                    <button className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                      {headerContent.enText}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-lg border bg-white p-6 dark:bg-black">
      {/* Tooltip indicators */}
      {activeSection && (
        <div className="mb-3 rounded-md bg-primary/10 p-2 text-center shadow-sm">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
            <span className="text-sm font-medium text-primary">
              {activeSection === "logo_data" ? (
                <span>Editing Logo</span>
              ) : activeSection === "menu_items" ? (
                <span>Editing Menu Items</span>
              ) : (
                <span>Editing Language Dropdown</span>
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
          Header Section
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
                  <div className="origin-top scale-100 pb-12 pt-0">
                    {renderHeaderContent()}
                    <div className="h-[400px] p-4 text-center text-sm text-gray-500">
                      Page content would appear here
                    </div>
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
              <div className="h-[500px] overflow-y-auto overflow-x-hidden bg-white dark:bg-black">
                <div className="origin-top scale-100 pb-10">
                  {renderHeaderContent()}
                  <div className="h-[400px] p-4 text-center text-sm text-gray-500">
                    Page content would appear here
                  </div>
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

export default HeaderPreview;
