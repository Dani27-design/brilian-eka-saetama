"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext"; // Import language context

// Define translations
const translations = {
  id: {
    dashboard: "Dasbor",
    websiteManagement: "Manajemen Website",
    headerSection: "Bagian Header",
    heroSection: "Bagian Hero",
    serviceSection: "Bagian Layanan",
    aboutSection: "Bagian Tentang",
    clientSatisfactionSection: "Bagian Kepuasan Klien",
    clientListSection: "Bagian Daftar Klien",
    faqSection: "Bagian FAQ",
    testimonialSection: "Bagian Testimoni",
    contactSection: "Bagian Kontak",
    blogSection: "Bagian Blog",
    footerSection: "Bagian Footer",
    blogManagement: "Manajemen Blog",
    mediaLibrary: "Pustaka Media",
    checksheetApar: "Lembar Periksa APAR",
    userManagement: "Manajemen Pengguna", // Added translation for user management
    settings: "Pengaturan Akun", // Tambahkan ini
  },
  en: {
    dashboard: "Dashboard",
    websiteManagement: "Website Management",
    headerSection: "Header Section",
    heroSection: "Hero Section",
    serviceSection: "Service Section",
    aboutSection: "About Section",
    clientSatisfactionSection: "Client Satisfaction Section",
    clientListSection: "Client List Section",
    faqSection: "FAQ Section",
    testimonialSection: "Testimonial Section",
    contactSection: "Contact Section",
    blogSection: "Blog Section",
    footerSection: "Footer Section",
    blogManagement: "Blog Management",
    mediaLibrary: "Media Library",
    checksheetApar: "Checksheet APAR",
    userManagement: "User Management", // Added translation for user management
    settings: "Account Settings", // Tambahkan ini
  },
};

export default function AdminSidebar({
  onToggle,
  isOpen,
  onClose,
  isMobile,
  userData,
}) {
  const [websiteContentExpanded, setWebsiteContentExpanded] = useState(false);
  const pathname = usePathname();
  const { language } = useLanguage(); // Get current language
  const t =
    translations[language as keyof typeof translations] || translations.en;

  // Toggle sidebar function for desktop
  const toggleSidebar = () => {
    const newState = !isOpen;
    onToggle(newState); // Notify parent component about the change
  };

  useEffect(() => {
    if (pathname && pathname.includes("/admin/collections/")) {
      setWebsiteContentExpanded(true);
    }
  }, []);

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`${isOpen ? "w-64" : "w-20"} ${
          isMobile
            ? `fixed left-0 top-0 z-40 h-screen transform transition-transform duration-300 ${
                isOpen ? "translate-x-0" : "-translate-x-full"
              } lg:hidden`
            : "fixed left-0 top-0 z-40 hidden h-screen transition-all duration-300 ease-in-out lg:block"
        } overflow-y-scroll border-r border-stroke bg-white pb-5 dark:border-strokedark dark:bg-black`}
      >
        {/* Header dengan foto profil */}
        <div className="flex flex-col items-center border-b border-stroke px-4 py-4 dark:border-strokedark">
          {/* User profile photo */}
          <div className="mb-2 flex items-center justify-center">
            <div
              className={`${
                isOpen ? "h-24 w-24" : "h-12 w-12"
              } overflow-hidden rounded-full border-2 border-primary`}
            >
              {userData?.photoURL ? (
                <Image
                  src={userData.photoURL}
                  alt="Profile"
                  width={isOpen ? 96 : 48}
                  height={isOpen ? 96 : 48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`${isOpen ? "h-12 w-12" : "h-6 w-6"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* User name */}
          {isOpen && (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-black dark:text-white">
                {userData?.name || "Admin"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {userData?.role || ""}
              </p>
            </div>
          )}

          {/* Toggle sidebar button */}
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className="mt-4 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-black dark:text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    isOpen
                      ? "M11 19l-7-7 7-7m8 14l-7-7 7-7"
                      : "M13 5l7 7-7 7M5 5l7 7-7 7"
                  }
                />
              </svg>
            </button>
          )}
        </div>

        {/* Mobile close button */}
        {isMobile && (
          <div className="flex justify-end p-2">
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-900 lg:hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-black dark:text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Navigasi - sisanya sama */}
        <nav className="mt-4 px-2">
          <ul className="space-y-2">
            {/* Dashboard Link */}
            <li>
              <Link
                href="/admin/dashboard"
                className={`flex items-center rounded-lg px-0 py-2 text-base font-medium transition-colors ${
                  pathname === "/admin/dashboard"
                    ? "bg-primary text-white"
                    : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                }`}
              >
                <div className="px-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </div>
                {isOpen && <span>{t.dashboard}</span>}
              </Link>
            </li>

            {/* User Management Link - NEW MENU */}
            <li>
              <Link
                href="/admin/users"
                onClick={isMobile ? onClose : undefined}
                className={`flex items-center rounded-lg px-0 py-2 text-base font-medium transition-colors ${
                  pathname === "/admin/users" ||
                  (pathname && pathname.startsWith("/admin/users/"))
                    ? "bg-primary text-white"
                    : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                }`}
              >
                <div className="px-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                {isOpen && <span>{t.userManagement}</span>}
              </Link>
            </li>

            {/* Website Content Section */}
            <li className="mb-1">
              <div
                className={`flex cursor-pointer items-center justify-between rounded-lg px-0 py-2 text-base font-medium transition-colors`}
                onClick={() => {
                  setWebsiteContentExpanded(!websiteContentExpanded);
                }}
              >
                <div className="flex items-center">
                  <div className="px-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                  </div>
                  {isOpen && <span>{t.websiteManagement}</span>}
                </div>
                {isOpen && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform ${
                      websiteContentExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>

              {websiteContentExpanded && (
                <ul className={`space-y-1 pt-1 ${isOpen ? "ml-6" : ""}`}>
                  {/* Header Section Editor Link */}
                  <li>
                    <Link
                      href="/admin/collections/header"
                      onClick={isMobile ? onClose : undefined}
                      className={`flex items-center rounded-lg px-0 py-2 text-base font-medium transition-colors ${
                        pathname === "/admin/collections/header" ||
                        (pathname &&
                          pathname.includes("/admin/collections/header/edit/"))
                          ? "bg-primary text-white"
                          : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="px-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 7h18M3 12h18m-9 5h9M3 17h6m-6-4h6m-6-4h6m-6-4h6M3 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                          />
                        </svg>
                      </div>
                      {isOpen && <span>{t.headerSection}</span>}
                    </Link>
                  </li>

                  {/* Hero Section Editor Link */}
                  <li>
                    <Link
                      href="/admin/collections/hero"
                      onClick={isMobile ? onClose : undefined}
                      className={`flex items-center rounded-lg px-0 py-2 text-base font-medium transition-colors ${
                        pathname === "/admin/collections/hero" ||
                        (pathname &&
                          pathname.includes("/admin/collections/hero/edit/"))
                          ? "bg-primary text-white"
                          : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="px-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 10h16M4 14h16M4 18h7"
                          />
                        </svg>
                      </div>
                      {isOpen && <span>{t.heroSection}</span>}
                    </Link>
                  </li>

                  {/* Services Section Editor Link */}
                  <li>
                    <Link
                      href="/admin/collections/services"
                      onClick={isMobile ? onClose : undefined}
                      className={`flex items-center rounded-lg px-0 py-2 text-base font-medium transition-colors ${
                        pathname === "/admin/collections/services" ||
                        (pathname &&
                          pathname.includes(
                            "/admin/collections/services/edit/",
                          ))
                          ? "bg-primary text-white"
                          : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="px-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      {isOpen && <span>{t.serviceSection}</span>}
                    </Link>
                  </li>

                  {/* About Section Editor Link */}
                  <li>
                    <Link
                      href="/admin/collections/about"
                      onClick={isMobile ? onClose : undefined}
                      className={`flex items-center rounded-lg px-0 py-2 text-base font-medium transition-colors ${
                        pathname === "/admin/collections/about" ||
                        (pathname &&
                          pathname.includes("/admin/collections/about/edit/"))
                          ? "bg-primary text-white"
                          : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="px-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      {isOpen && <span>{t.aboutSection}</span>}
                    </Link>
                  </li>

                  {/* Clients Section Editor Link */}
                  <li>
                    <Link
                      href="/admin/collections/clients"
                      onClick={isMobile ? onClose : undefined}
                      className={`flex items-center rounded-lg px-0 py-2 text-base font-medium transition-colors ${
                        pathname === "/admin/collections/clients" ||
                        (pathname &&
                          pathname.includes("/admin/collections/clients/edit/"))
                          ? "bg-primary text-white"
                          : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="px-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      {isOpen && <span>{t.clientSatisfactionSection}</span>}
                    </Link>
                  </li>

                  {/* Clients Info Section Editor Link */}
                  <li>
                    <Link
                      href="/admin/collections/clientsInfo"
                      onClick={isMobile ? onClose : undefined}
                      className={`flex items-center rounded-lg px-0 py-2 text-base font-medium transition-colors ${
                        pathname === "/admin/collections/clientsInfo" ||
                        (pathname &&
                          pathname.includes(
                            "/admin/collections/clientsInfo/edit/",
                          ))
                          ? "bg-primary text-white"
                          : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="px-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      {isOpen && <span>{t.clientListSection}</span>}
                    </Link>
                  </li>

                  {/* FAQ Section Editor Link */}
                  <li>
                    <Link
                      href="/admin/collections/faq"
                      onClick={isMobile ? onClose : undefined}
                      className={`flex items-center rounded-lg px-0 py-2 text-base font-medium transition-colors ${
                        pathname === "/admin/collections/faq" ||
                        (pathname &&
                          pathname.includes("/admin/collections/faq/edit/"))
                          ? "bg-primary text-white"
                          : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="px-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      {isOpen && <span>{t.faqSection}</span>}
                    </Link>
                  </li>

                  {/* Testimonial Section Editor Link */}
                  <li>
                    <Link
                      href="/admin/collections/testimonial"
                      onClick={isMobile ? onClose : undefined}
                      className={`flex items-center rounded-lg px-0 py-2 text-base font-medium transition-colors ${
                        pathname === "/admin/collections/testimonial" ||
                        (pathname &&
                          pathname.includes(
                            "/admin/collections/testimonial/edit/",
                          ))
                          ? "bg-primary text-white"
                          : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="px-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                          />
                        </svg>
                      </div>
                      {isOpen && <span>{t.testimonialSection}</span>}
                    </Link>
                  </li>

                  {/* Contact Section Editor Link */}
                  <li>
                    <Link
                      href="/admin/collections/contact"
                      onClick={isMobile ? onClose : undefined}
                      className={`flex items-center rounded-lg px-0 py-2 text-base font-medium transition-colors ${
                        pathname === "/admin/collections/contact" ||
                        (pathname &&
                          pathname.includes("/admin/collections/contact/edit/"))
                          ? "bg-primary text-white"
                          : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="px-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      {isOpen && <span>{t.contactSection}</span>}
                    </Link>
                  </li>

                  {/* Blog Section Editor Link */}
                  <li>
                    <Link
                      href="/admin/collections/blog"
                      onClick={isMobile ? onClose : undefined}
                      className={`flex items-center rounded-lg px-0 py-2 text-base font-medium transition-colors ${
                        pathname === "/admin/collections/blog" ||
                        (pathname &&
                          pathname.includes("/admin/collections/blog/edit/"))
                          ? "bg-primary text-white"
                          : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="px-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15M9 11l3 3m0 0l3-3m-3 3V8"
                          />
                        </svg>
                      </div>
                      {isOpen && <span>{t.blogSection}</span>}
                    </Link>
                  </li>

                  {/* Footer Section Editor Link */}
                  <li>
                    <Link
                      href="/admin/collections/footer"
                      onClick={isMobile ? onClose : undefined}
                      className={`flex items-center rounded-lg px-0 py-2 text-base font-medium transition-colors ${
                        pathname === "/admin/collections/footer" ||
                        (pathname &&
                          pathname.includes("/admin/collections/footer/edit/"))
                          ? "bg-primary text-white"
                          : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="px-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 13l-7 7-7-7m14-8l-7 7-7-7"
                          />
                        </svg>
                      </div>
                      {isOpen && <span>{t.footerSection}</span>}
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Blog Posts Menu Item */}
            <li>
              <Link
                href="/admin/blogs"
                onClick={isMobile ? onClose : undefined}
                className={`flex items-center rounded-lg px-0 py-2 text-base font-medium transition-colors ${
                  pathname === "/admin/blogs" ||
                  (pathname && pathname.startsWith("/admin/blogs/"))
                    ? "bg-primary text-white"
                    : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                }`}
              >
                <div className="px-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                {isOpen && <span>{t.blogManagement}</span>}
              </Link>
            </li>

            {/* Media Library Link */}
            <li>
              <Link
                href="/admin/media"
                onClick={isMobile ? onClose : undefined}
                className={`flex items-center rounded-lg px-0 py-2 text-base font-medium transition-colors ${
                  pathname === "/admin/media"
                    ? "bg-primary text-white"
                    : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                }`}
              >
                <div className="px-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                {isOpen && <span>{t.mediaLibrary}</span>}
              </Link>
            </li>

            {/* Checksheet Link */}
            <li>
              <Link
                href="/admin/checksheet-apar"
                onClick={isMobile ? onClose : undefined}
                className={`flex items-center rounded-lg px-0 py-2 text-base font-medium transition-colors ${
                  pathname === "/admin/checksheet-apar" ||
                  (pathname && pathname.startsWith("/admin/checksheet-apar/"))
                    ? "bg-primary text-white"
                    : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                }`}
              >
                <div className="px-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                {isOpen && <span>{t.checksheetApar}</span>}
              </Link>
            </li>

            {/* Settings/Pengaturan Menu - Tambahkan di akhir sebelum penutup ul */}
            <li>
              <Link
                href="/admin/settings"
                onClick={isMobile ? onClose : undefined}
                className={`flex items-center rounded-lg px-0 py-2 text-base font-medium transition-colors ${
                  pathname === "/admin/settings"
                    ? "bg-primary text-white"
                    : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                }`}
              >
                <div className="px-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                {isOpen && <span>{t.settings}</span>}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
