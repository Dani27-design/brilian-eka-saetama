"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import ThemeToggler from "./ThemeToggler";
import { useLanguage } from "@/app/context/LanguageContext";
import HeaderSkeleton from "../Skeleton/HeaderSkeleton";

// Header Props Type
interface HeaderProps {
  initialData: {
    logo?: {
      dark: string;
      light: string;
    };
    menu_items?: any[];
    language_dropdown?: {
      en_text: string;
      id_text: string;
    };
  };
  initialLanguage: string;
}

const ClientHeader = ({ initialData, initialLanguage }: HeaderProps) => {
  const [hashUrl, setHashUrl] = useState("");
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [dropdownToggler, setDropdownToggler] = useState(false);
  const [stickyMenu, setStickyMenu] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  // Use useMemo to process data
  const { menuItems, logoDark, logoLight, enText, idText } = useMemo(() => {
    let items: any[] = [];
    let darkLogo = "/images/logo/logo-dark.png"; // Default logo paths
    let lightLogo = "/images/logo/logo-light.png";
    let englishText = "🇬🇧 English";
    let indonesianText = "🇮🇩 Indonesia";

    // Process menu items if available
    if (initialData?.menu_items) {
      items = initialData.menu_items;
    }

    // Process logo data if available
    if (initialData?.logo) {
      darkLogo = initialData.logo.dark || darkLogo;
      lightLogo = initialData.logo.light || lightLogo;
    }

    // Process language dropdown data if available
    if (initialData?.language_dropdown) {
      englishText = initialData.language_dropdown.en_text || englishText;
      indonesianText = initialData.language_dropdown.id_text || indonesianText;
    }

    return {
      menuItems: items,
      logoDark: darkLogo,
      logoLight: lightLogo,
      enText: englishText,
      idText: indonesianText,
    };
  }, [initialData]);

  // Toggle dropdown menu
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Handle language change
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setIsOpen(false); // Close dropdown after selection
  };

  // Functions that depend on browser APIs are wrapped in useEffect
  useEffect(() => {
    // Sticky menu handler
    const handleStickyMenu = () => {
      if (window.scrollY >= 80) {
        setStickyMenu(true);
      } else {
        setStickyMenu(false);
      }
    };

    // Update hash from URL
    const updateHashFromUrl = () => {
      const currentHash = window.location.hash;
      setHashUrl(currentHash);
    };

    // Initialize hash from URL
    updateHashFromUrl();

    // Add event listeners
    window.addEventListener("scroll", handleStickyMenu);
    window.addEventListener("hashchange", updateHashFromUrl);

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleStickyMenu);
      window.removeEventListener("hashchange", updateHashFromUrl);
    };
  }, []);

  // Function for smooth scrolling - implemented safely
  const scrollToElement = (targetId: string, closeMenu = true) => {
    // Only run this in the browser
    if (typeof window === "undefined") return;

    // Remove leading slash and hash if exists
    const id = targetId.replace(/^\/?(#)?/, "");
    if (!id) return;

    // Close mobile menu if open and requested
    if (closeMenu && navigationOpen) {
      setNavigationOpen(false);
    }

    // Update URL and state
    const newHash = `#${id}`;
    if (window.location.hash !== newHash) {
      window.history.pushState(null, "", newHash);
      setHashUrl(newHash);
    }

    // Find element and scroll to it
    const element = document.getElementById(id);
    if (!element) return;

    // Calculate header height plus extra margin
    const headerElement = document.querySelector("header");
    const headerHeight = headerElement ? headerElement.offsetHeight : 120;
    const extraMargin = 50;

    const rect = element.getBoundingClientRect();
    const absoluteTop = rect.top + window.pageYOffset;
    const scrollTarget = absoluteTop - headerHeight - extraMargin;

    window.scrollTo({
      top: scrollTarget,
      behavior: "smooth",
    });
  };

  // Function to handle smooth scroll on link click
  const handleSmoothScroll = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    scrollToElement(targetId);
  };

  // Function to scroll to top
  const scrollToTop = () => {
    if (typeof window === "undefined") return;

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // Reset URL hash
    if (window.location.hash) {
      window.history.pushState({}, "", window.location.pathname);
      setHashUrl("");
    }
  };

  return (
    <header
      className={`fixed left-0 top-0 z-99999 mx-0 w-full px-0 py-5 ${
        stickyMenu
          ? "bg-white !py-1 shadow transition duration-100 dark:bg-black"
          : ""
      }`}
    >
      <div className="relative mx-auto max-w-c-1280 items-center justify-between px-3 md:px-3 xl:flex 2xl:px-0">
        <div className="flex w-full items-center justify-between xl:max-w-[12%]">
          <Image
            src={logoDark}
            alt="logo"
            width={55}
            height={54}
            className="hidden dark:block"
            onClick={scrollToTop}
            style={{
              cursor: "pointer",
              width: "auto",
              height: "auto",
            }}
            priority={true}
            quality={80}
          />
          <Image
            src={logoLight}
            alt="logo"
            width={55}
            height={54}
            className="dark:hidden"
            onClick={scrollToTop}
            style={{
              cursor: "pointer",
              width: "auto",
              height: "auto",
            }}
            priority={true}
            quality={80}
          />

          {/* Hamburger Toggle Button */}
          <button
            aria-label="hamburger Toggler"
            className="block xl:hidden"
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
        </div>

        {/* Nav Menu */}
        <div
          className={`invisible h-0 w-full items-center justify-between xl:visible xl:flex xl:h-auto xl:w-full ${
            navigationOpen &&
            "navbar !visible mt-4 h-auto max-h-[400px] rounded-md bg-white p-7.5 shadow-solid-5 dark:bg-blacksection xl:h-auto xl:p-0 xl:shadow-none xl:dark:bg-transparent"
          }`}
        >
          <nav>
            <ul className="flex flex-col gap-5 xl:flex-row xl:items-center xl:gap-10">
              {menuItems.map((menuItem, key) => (
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
                            <Link href={item.path || "#"}>{item.title}</Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : menuItem?.path?.startsWith("#") ? (
                    <a
                      href={menuItem.path}
                      onClick={(e) =>
                        handleSmoothScroll(e, menuItem.path || "")
                      }
                      className={
                        hashUrl === menuItem.path
                          ? "text-primary hover:text-primary"
                          : "hover:text-primary"
                      }
                    >
                      {menuItem.title}
                    </a>
                  ) : (
                    <Link
                      href={menuItem?.path || ""}
                      onClick={() => setHashUrl(menuItem?.path || "")}
                      className={
                        hashUrl === menuItem.path
                          ? "text-primary hover:text-primary"
                          : "hover:text-primary"
                      }
                    >
                      {menuItem.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-7 flex w-fit items-center gap-6 xl:mt-0">
            <ThemeToggler />

            {/* Language switcher - only render on client side */}
            <div className="relative inline-block text-left">
              <div>
                <button
                  onClick={toggleDropdown}
                  type="button"
                  className="flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-regular text-white duration-300 ease-in-out hover:bg-primaryho focus:outline-none"
                  aria-expanded={isOpen}
                >
                  {language === "en" ? enText : idText}
                </button>
              </div>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div
                    className="py-1"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="options-menu"
                  >
                    <button
                      onClick={() => handleLanguageChange("id")}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {idText}
                    </button>
                    <button
                      onClick={() => handleLanguageChange("en")}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {enText}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ClientHeader;
