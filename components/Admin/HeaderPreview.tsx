"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import ThemeToggler from "../Header/ThemeToggler";
import { useLanguage } from "@/app/context/LanguageContext";

interface HeaderPreviewProps {
  data: any;
  activeSection?:
    | "menu_items"
    | "logo_dark"
    | "logo_light"
    | "language_dropdown";
  onEditSection?: (section: string) => void;
  previewMode?: "desktop" | "mobile";
  onPreviewModeChange?: (mode: "desktop" | "mobile") => void;
  showToggleButtons?: boolean;
}

const HeaderPreview = ({
  data,
  activeSection,
  onEditSection,
  previewMode = "desktop",
  onPreviewModeChange,
  showToggleButtons = false,
}: HeaderPreviewProps) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [dropdownToggler, setDropdownToggler] = useState(false);
  const [internalPreviewMode, setInternalPreviewMode] = useState<
    "desktop" | "mobile"
  >(previewMode);
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

  // Extract data for the header components
  const menuItems = data?.menu_items?.[language] || [];
  const logoDark = data?.logo_dark?.[language] || "/images/logo/logo-dark.png";
  const logoLight =
    data?.logo_light?.[language] || "/images/logo/logo-light.png";
  const langDropdown = data?.language_dropdown?.[language] || {
    en_text: "🇬🇧 English",
    id_text: "🇮🇩 Indonesia",
  };

  const enText = langDropdown.en_text || "🇬🇧 English";
  const idText = langDropdown.id_text || "🇮🇩 Indonesia";

  const toggleNavigationMenu = () => {
    setNavigationOpen(!navigationOpen);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative h-fit w-full overflow-x-hidden">
      {/* Preview mode toggle buttons */}
      <div className="mb-4 flex justify-end space-x-2">
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

      <div className="rounded-lg border border-stroke">
        <header
          className={`bg-white py-5 shadow-sm dark:bg-black ${
            currentPreviewMode === "mobile" ? "mx-auto max-w-[375px]" : "w-full"
          }`}
        >
          <div
            className={`relative mx-auto w-full items-center justify-between px-4 md:px-8 ${
              currentPreviewMode === "desktop" ? "xl:flex" : ""
            } 2xl:px-0`}
          >
            {/* Logo Section */}
            <div
              className={`flex w-full items-center justify-between ${
                currentPreviewMode === "desktop" ? "xl:max-w-[12%]" : ""
              }`}
              onClick={() => {
                if (
                  activeSection !== "logo_dark" &&
                  activeSection !== "logo_light"
                ) {
                  onEditSection && onEditSection("logo_dark");
                }
              }}
            >
              <div
                className={`${
                  activeSection === "logo_dark" ||
                  activeSection === "logo_light"
                    ? "relative rounded-sm ring-2 ring-primary/40"
                    : ""
                } hover:cursor-pointer hover:rounded-sm hover:ring-2 hover:ring-primary/40`}
              >
                <Image
                  src={logoDark}
                  alt="logo"
                  width={45}
                  height={44}
                  className="hidden w-full dark:block"
                  priority={true}
                />
                <Image
                  src={logoLight}
                  alt="logo"
                  width={45}
                  height={44}
                  className="w-full dark:hidden"
                  priority={true}
                />
              </div>

              {/* Hamburger Toggle button - Matching exactly with the real header */}
              {currentPreviewMode === "mobile" && (
                <button
                  aria-label="hamburger Toggler"
                  className="block xl:hidden"
                  onClick={toggleNavigationMenu}
                >
                  <span className="relative block h-5.5 w-5.5 cursor-pointer">
                    <span className="absolute right-0 block h-full w-full">
                      <span
                        className={`relative left-0 top-0 my-1 block h-0.5 w-full rounded-sm bg-black delay-[0] duration-200 ease-in-out dark:bg-white ${
                          !navigationOpen ? "!w-full delay-300" : "w-0"
                        }`}
                      ></span>
                      <span
                        className={`relative left-0 top-0 my-1 block h-0.5 w-full rounded-sm bg-black delay-150 duration-200 ease-in-out dark:bg-white ${
                          !navigationOpen ? "delay-400 !w-full" : "w-0"
                        }`}
                      ></span>
                      <span
                        className={`relative left-0 top-0 my-1 block h-0.5 w-full rounded-sm bg-black delay-200 duration-200 ease-in-out dark:bg-white ${
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

            {/* Mobile Menu - Matching exactly with the real header */}
            {currentPreviewMode === "mobile" && (
              <div
                className={`${
                  navigationOpen
                    ? "navbar !visible mt-4 h-auto max-h-[400px] rounded-md bg-white p-7.5 shadow-solid-5 dark:bg-blacksection"
                    : "invisible h-0"
                } w-full xl:visible xl:h-auto xl:p-0 xl:shadow-none xl:dark:bg-transparent ${
                  activeSection === "menu_items"
                    ? "relative rounded-sm ring-2 ring-primary/40"
                    : ""
                }`}
                onClick={() =>
                  activeSection !== "menu_items" &&
                  onEditSection &&
                  onEditSection("menu_items")
                }
              >
                <nav>
                  <ul className="flex flex-col gap-5">
                    {menuItems?.length > 0 &&
                      menuItems?.map((item, idx) => (
                        <li
                          key={idx}
                          className={item.submenu ? "group relative" : ""}
                        >
                          {item.submenu ? (
                            <>
                              <span className="flex cursor-pointer items-center justify-between gap-3 hover:text-primary">
                                {item.title}
                                <span>
                                  <svg
                                    className="h-3 w-3 cursor-pointer fill-waterloo group-hover:fill-primary"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 512 512"
                                  >
                                    <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
                                  </svg>
                                </span>
                              </span>
                            </>
                          ) : (
                            <span className="hover:text-primary">
                              {item.title}
                            </span>
                          )}
                        </li>
                      ))}
                  </ul>
                </nav>

                {/* Mobile menu footer actions */}
                <div className="mt-7 flex items-center gap-6">
                  <ThemeToggler />

                  {/* Language Dropdown - Mobile */}
                  <div
                    className={`relative inline-block text-left ${
                      activeSection === "language_dropdown"
                        ? "rounded-sm ring-2 ring-primary/40"
                        : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      activeSection !== "language_dropdown" &&
                        onEditSection &&
                        onEditSection("language_dropdown");
                    }}
                  >
                    <button
                      onClick={toggleDropdown}
                      type="button"
                      className="flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-regular text-white duration-300 ease-in-out hover:bg-primaryho"
                    >
                      {language === "en" ? enText : idText}
                    </button>

                    {isOpen && (
                      <div className="absolute right-0 mt-2 w-36 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div
                          className="py-1"
                          role="menu"
                          aria-orientation="vertical"
                        >
                          <button className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                            {idText}
                          </button>
                          <button className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                            {enText}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Menu */}
            {currentPreviewMode === "desktop" && (
              <div
                className={`${
                  navigationOpen ? "navbar !visible" : "invisible h-0"
                } w-full items-center justify-between xl:visible xl:flex xl:h-auto xl:w-full`}
                onClick={() =>
                  activeSection !== "menu_items" &&
                  onEditSection &&
                  onEditSection("menu_items")
                }
              >
                <nav
                  className={`${
                    activeSection === "menu_items"
                      ? "relative rounded-sm ring-2 ring-primary/40"
                      : ""
                  } hover:cursor-pointer hover:rounded-sm hover:ring-2 hover:ring-primary/40`}
                >
                  <ul className="hidden items-center gap-5 xl:flex">
                    {menuItems?.length > 0 &&
                      menuItems?.map((item, idx) => (
                        <li
                          key={idx}
                          className={item.submenu ? "group relative" : ""}
                        >
                          {item.submenu ? (
                            <span className="flex cursor-pointer items-center justify-between gap-3 hover:text-primary">
                              {item.title}
                              <span>
                                <svg
                                  className="h-3 w-3 cursor-pointer fill-waterloo group-hover:fill-primary"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 512 512"
                                >
                                  <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
                                </svg>
                              </span>
                            </span>
                          ) : (
                            <span className="text-sm hover:text-primary">
                              {item.title}
                            </span>
                          )}
                        </li>
                      ))}
                  </ul>
                </nav>

                {/* Right side actions */}
                <div className="mt-7 flex items-center gap-6 xl:mt-0">
                  <ThemeToggler disabled={true} />

                  {/* Language Dropdown */}
                  <div
                    className={`relative inline h-fit text-left ${
                      activeSection === "language_dropdown"
                        ? "rounded-sm ring-2 ring-primary/40"
                        : ""
                    } hover:cursor-pointer hover:rounded-sm hover:ring-2 hover:ring-primary/40`}
                    onClick={(e) => {
                      e.stopPropagation();
                      activeSection !== "language_dropdown" &&
                        onEditSection &&
                        onEditSection("language_dropdown");
                    }}
                  >
                    <button
                      //   onClick={toggleDropdown}
                      type="button"
                      className="flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm text-white duration-300 ease-in-out hover:bg-primaryho"
                    >
                      {language === "en" ? enText : idText}
                    </button>

                    {isOpen && (
                      <div className="absolute right-0 z-99999 mt-2 w-36 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div
                          className="py-1"
                          role="menu"
                          aria-orientation="vertical"
                        >
                          <button className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                            {idText}
                          </button>
                          <button className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                            {enText}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>
      </div>

      {/* Subtle tooltip indicators that don't cover content */}
      {activeSection && (
        <div className="mt-2 text-center text-xs text-gray-500">
          {activeSection === "logo_dark" || activeSection === "logo_light" ? (
            <span>Editing Logo • Click on other sections to edit them</span>
          ) : activeSection === "menu_items" ? (
            <span>
              Editing Menu Items • Click on other sections to edit them
            </span>
          ) : (
            <span>
              Editing Language Settings • Click on other sections to edit them
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default HeaderPreview;
