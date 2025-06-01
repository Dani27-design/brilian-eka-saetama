"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getData } from "@/actions/read/hero";

import ThemeToggler from "./ThemeToggler";
import { useLanguage } from "@/app/context/LanguageContext";
import HeaderSkeleton from "../Skeleton/HeaderSkeleton";

const useHeaderData = (lang: string, collectionId: string, docId: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: [`${collectionId}-${docId}-${lang}`],
    queryFn: async () => {
      const data = getData(lang, collectionId, docId);
      return data;
    },
    staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
    gcTime: 1000 * 60 * 5, // Data will stay in cache for 5 minutes after it becomes inactive
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchIntervalInBackground: true,
    retry: false,
    initialData: () => {
      return queryClient.getQueryData([`${collectionId}-${docId}-${lang}`]);
    },
  });
};

const Header = () => {
  const [hashUrl, setHashUrl] = useState("");
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [dropdownToggler, setDropdownToggler] = useState(false);
  const [stickyMenu, setStickyMenu] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  // Fetch menu data
  const {
    data: menuItemsData,
    isLoading: isLoadingMenuItems,
    error: errorMenuItems,
  } = useHeaderData(language, "header", "menu_items");

  // Fetch logo data
  const {
    data: logoData,
    isLoading: isLoadingLogo,
    error: errorLogo,
  } = useHeaderData(language, "header", "logo_data");

  // Fetch language dropdown data
  const {
    data: langDropdownData,
    isLoading: isLoadingLangDropdown,
    error: errorLangDropdown,
  } = useHeaderData(language, "header", "language_dropdown");

  // Log errors
  useEffect(() => {
    [
      { name: "menu_items", error: errorMenuItems },
      { name: "logo_data", error: errorLogo },
      { name: "language_dropdown", error: errorLangDropdown },
    ].forEach(({ name, error }) => {
      if (error) {
        console.error(`Error fetching ${name} data:`, error);
      }
    });
  }, [errorMenuItems, errorLogo, errorLangDropdown]);

  // Check if any data is loading
  const isLoading =
    isLoadingMenuItems || isLoadingLogo || isLoadingLangDropdown;

  // Define types for menu items
  interface MenuItem {
    title: string;
    path?: string;
    submenu?: MenuItem[];
  }

  // Process data with useMemo to avoid unnecessary recalculations
  const { menuItems, logoDark, logoLight, enText, idText } = useMemo(() => {
    let items: MenuItem[] = [];
    let darkLogo = "/images/logo/logo-dark.png"; // Default logo paths
    let lightLogo = "/images/logo/logo-light.png";
    let englishText = "🇬🇧 English";
    let indonesianText = "🇮🇩 Indonesia";

    // Process menu items if available
    if (menuItemsData) {
      items = menuItemsData as MenuItem[];
    }

    // Process logo data if available
    if (logoData) {
      darkLogo = logoData.dark || darkLogo;
      lightLogo = logoData.light || lightLogo;
    }

    // Process language dropdown data if available
    if (langDropdownData) {
      englishText = langDropdownData.en_text || englishText;
      indonesianText = langDropdownData.id_text || indonesianText;
    }

    return {
      menuItems: items,
      logoDark: darkLogo,
      logoLight: lightLogo,
      enText: englishText,
      idText: indonesianText,
    };
  }, [menuItemsData, logoData, langDropdownData]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setIsOpen(false); // Close dropdown after selection
  };

  // Sticky menu
  const handleStickyMenu = () => {
    if (window.scrollY >= 80) {
      setStickyMenu(true);
    } else {
      setStickyMenu(false);
    }
  };

  // Function to update hash from URL
  const updateHashFromUrl = () => {
    if (typeof window !== "undefined") {
      const currentHash = window.location.hash;
      setHashUrl(currentHash);
    }
  };

  // Function to handle initial scroll to hash when page loads/refreshes
  const scrollToInitialHash = () => {
    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.replace("#", "");
      const element = document.getElementById(id);

      if (element) {
        // Also update hashUrl state
        setHashUrl(window.location.hash);
        setTimeout(() => {
          const headerOffset = 100;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.scrollY - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }, 100); // Small delay to ensure DOM is fully loaded
      }
    }
  };

  // Event handler for the custom resetHashUrl event
  const handleResetHashUrl = (e: Event) => {
    const customEvent = e as CustomEvent;
    setHashUrl(customEvent.detail?.hash || "");
  };

  // Function for smooth scrolling
  const handleSmoothScroll = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();

    // Remove leading slash and hash if exists
    const id = targetId.replace(/^\/?(#)?/, "");

    if (id) {
      // Close mobile menu if open
      if (navigationOpen) {
        setNavigationOpen(false);
      }

      // Small delay to ensure DOM is ready and menu is closed
      setTimeout(() => {
        const element = document.getElementById(id);

        if (element) {
          // Calculate header offset
          const headerOffset = 100;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.scrollY - headerOffset;

          // Smooth scroll with offset
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });

          // Update URL and state
          const newHash = `#${id}`;
          if (window.location.hash !== newHash) {
            window.history.pushState(null, "", newHash);
            setHashUrl(newHash);
          }
        }
      }, 100);
    }
  };

  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // Reset hashUrl by explicitly setting to empty string
    window.history.pushState({}, "", "/");

    // Create custom event to notify Header component
    const customEvent = new CustomEvent("resetHashUrl", {
      detail: { hash: "" },
    });
    window.dispatchEvent(customEvent);

    // Also trigger standard events for safety
    const hashChangeEvent = new Event("hashchange", { bubbles: true });
    window.dispatchEvent(hashChangeEvent);

    const popStateEvent = new Event("popstate", { bubbles: true });
    window.dispatchEvent(popStateEvent);
  };

  // Unified effect for scroll handling
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initial setup - handle hash in URL when page loads
    updateHashFromUrl();
    scrollToInitialHash();

    // Event handlers
    const handleScroll = () => {
      handleStickyMenu();
    };

    const handleHashChangeEvent = () => {
      updateHashFromUrl();
    };

    const handleURLChange = () => {
      updateHashFromUrl();

      // Auto scroll to hash if present
      if (window.location.hash) {
        const id = window.location.hash.replace("#", "");
        const element = document.getElementById(id);

        if (element) {
          const headerOffset = 100;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.scrollY - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }
    };

    // Add event listeners
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("hashchange", handleHashChangeEvent);
    window.addEventListener("popstate", handleURLChange);
    window.addEventListener("resetHashUrl", handleResetHashUrl);

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", handleHashChangeEvent);
      window.removeEventListener("popstate", handleURLChange);
      window.removeEventListener("resetHashUrl", handleResetHashUrl);
    };
  }, []);

  // Add this effect to handle page refresh
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if this is a page reload
    const handlePageLoad = () => {
      // Use Performance API to detect refresh
      if (
        performance.getEntriesByType &&
        performance.getEntriesByType("navigation").length > 0
      ) {
        const navEntry = performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming;

        // If it's a reload/refresh...
        if (navEntry.type === "reload") {
          // If there's a hash in the URL
          if (window.location.hash) {
            // Remove the hash and reload to the same page without hash
            window.location.href = window.location.pathname;
            return;
          }

          // If not already on home page (no hash case)
          if (window.location.pathname !== "/") {
            // Redirect to home page
            window.location.href = window.location.origin;
            return;
          }

          // Force scroll to top if on home page
          window.scrollTo(0, 0);
        }
      }
    };

    // Run once on component mount
    handlePageLoad();
  }, []);

  return (
    <header
      className={`fixed left-0 top-0 z-99999 mx-0 w-full px-0 py-5 ${
        stickyMenu
          ? "bg-white !py-1 shadow transition duration-100 dark:bg-black"
          : ""
      }`}
    >
      <div className="relative mx-auto max-w-c-1280 items-center justify-between px-0 md:px-0 xl:flex 2xl:px-0">
        {isLoading ? (
          <HeaderSkeleton />
        ) : (
          <>
            <div className="flex w-full items-center justify-between xl:max-w-[12%]">
              <a>
                <Image
                  src={logoDark}
                  alt="logo"
                  width={55}
                  height={54}
                  className="hidden w-full dark:block"
                  onClick={scrollToTop}
                  style={{ cursor: "pointer" }}
                  priority={true} // For above-the-fold images
                  quality={80} // Balance between quality and size
                  loading="eager" // For critical images
                />
                <Image
                  src={logoLight}
                  alt="logo"
                  width={55}
                  height={54}
                  className="w-full dark:hidden"
                  onClick={scrollToTop}
                  style={{ cursor: "pointer" }}
                  priority={true} // For above-the-fold images
                  quality={80} // Balance between quality and size
                  loading="eager" // For critical images
                />
              </a>

              {/* <!-- Hamburger Toggle BTN --> */}
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
              {/* <!-- Hamburger Toggle BTN --> */}
            </div>

            {/* Nav Menu Start   */}
            <div
              className={`invisible h-0 w-full items-center justify-between xl:visible xl:flex xl:h-auto xl:w-full ${
                navigationOpen &&
                "navbar !visible mt-4 h-auto max-h-[400px] rounded-md bg-white p-7.5 shadow-solid-5 dark:bg-blacksection xl:h-auto xl:p-0 xl:shadow-none xl:dark:bg-transparent"
              }`}
            >
              <nav>
                <ul className="flex flex-col gap-5 xl:flex-row xl:items-center xl:gap-10">
                  {menuItems.map((menuItem, key) => (
                    <li
                      key={key}
                      className={menuItem.submenu && "group relative"}
                    >
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
                            className={`dropdown ${
                              dropdownToggler ? "flex" : ""
                            }`}
                          >
                            {menuItem.submenu.map((item, key) => (
                              <li key={key} className="hover:text-primary">
                                <Link href={item.path || "#"}>
                                  {item.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : menuItem?.path?.startsWith("#") ? (
                        <a
                          href={menuItem.path}
                          onClick={(e) =>
                            handleSmoothScroll(e, menuItem?.path ?? "")
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
                          href={menuItem?.path ?? ""}
                          onClick={() => setHashUrl(menuItem?.path ?? "")}
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

              <div className="mt-7 flex items-center gap-6 xl:mt-0">
                <ThemeToggler />

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
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
