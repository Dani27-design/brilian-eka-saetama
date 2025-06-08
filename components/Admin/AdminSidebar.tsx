"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";

export default function AdminSidebar({ onToggle }) {
  const [isOpen, setIsOpen] = useState(true);
  const [websiteContentExpanded, setWebsiteContentExpanded] = useState(false);
  const [collections, setCollections] = useState<string[]>([]);
  const pathname = usePathname();

  // Toggle sidebar function
  const toggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle(newState); // Notify parent component about the change
  };

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        // Known collections from your application
        const knownCollections = [
          "header",
          "hero",
          "services",
          "about",
          "clients",
          "clientsInfo",
          "faq",
          "testimonial",
          "contact",
          "blog",
          "footer",
        ];

        const availableCollections: string[] = [];

        for (const collectionId of knownCollections) {
          try {
            const q = query(collection(firestore, collectionId), limit(1));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.size > 0) {
              availableCollections.push(collectionId);
            }
          } catch (error) {
            console.log(`Collection ${collectionId} not accessible`);
          }
        }

        setCollections(availableCollections);
      } catch (error) {
        console.error("Error fetching collections:", error);
      }
    };

    fetchCollections();
  }, []);

  // Generic icon component for menu items
  const CollectionIcon = () => (
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
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  );

  return (
    <div
      className={`${
        isOpen ? "w-64" : "w-20"
      } fixed left-0 top-0 z-40 h-screen overflow-y-scroll border-r border-stroke bg-white pb-5 transition-all duration-300 ease-in-out dark:border-strokedark dark:bg-black`}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/admin/dashboard" className="flex items-center">
          {isOpen ? (
            <>
              <Image
                src="/images/logo/logo-light.png"
                alt="Logo"
                width={40}
                height={40}
                className="dark:hidden"
                priority={true} // For above-the-fold images
                quality={80} // Balance between quality and size
                loading="eager" // For critical images
              />
              <Image
                src="/images/logo/logo-dark.png"
                alt="Logo"
                width={40}
                height={40}
                className="hidden dark:block"
                priority={true} // For above-the-fold images
                quality={80} // Balance between quality and size
                loading="eager" // For critical images
              />
              <h1 className="ml-2 text-xl font-bold text-black dark:text-white">
                Admin
              </h1>
            </>
          ) : (
            <>
              <Image
                src="/images/logo/logo-light.png"
                alt="Logo"
                width={40}
                height={40}
                className="dark:hidden"
                priority={true} // For above-the-fold images
                quality={80} // Balance between quality and size
                loading="eager" // For critical images
              />
              <Image
                src="/images/logo/logo-dark.png"
                alt="Logo"
                width={40}
                height={40}
                className="hidden dark:block"
                priority={true} // For above-the-fold images
                quality={80} // Balance between quality and size
                loading="eager" // For critical images
              />
            </>
          )}
        </Link>

        <button
          onClick={toggleSidebar}
          className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-900"
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
      </div>

      <nav className="mt-3 px-4">
        <ul className="space-y-2">
          {/* Dashboard Link */}
          <li>
            <Link
              href="/admin/dashboard"
              className={`flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                pathname === "/admin/dashboard"
                  ? "bg-primary text-white"
                  : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
              }`}
            >
              <div className="mr-3">
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
              {isOpen && <span>Dashboard</span>}
            </Link>
          </li>

          {/* New Checksheet APAR Link */}
          <li>
            <Link
              href="/admin/checksheet-apar"
              className={`flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                pathname === "/admin/checksheet-apar" ||
                pathname.startsWith("/admin/checksheet-apar/")
                  ? "bg-primary text-white"
                  : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
              }`}
            >
              <div className="mr-3">
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
              {isOpen && <span>Checksheet APAR</span>}
            </Link>
          </li>

          {/* Media Library Link */}
          <li>
            <Link
              href="/admin/media"
              className={`flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                pathname === "/admin/media"
                  ? "bg-primary text-white"
                  : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
              }`}
            >
              <div className="mr-3">
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
              {isOpen && <span>Media Library</span>}
            </Link>
          </li>

          {/* Website Content Section */}
          <li className="mb-1">
            <div
              className={`flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 text-base font-medium transition-colors`}
              onClick={() => {
                setWebsiteContentExpanded(!websiteContentExpanded);
              }}
            >
              <div className="flex items-center">
                <div className="mr-3">
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
                {isOpen && <span>Website Content</span>}
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
                    className={`flex items-center rounded-lg px-4 py-2 text-base font-medium transition-colors ${
                      pathname === "/admin/collections/header"
                        ? "bg-primary text-white"
                        : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="mr-3">
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
                    {isOpen && <span>Header Section</span>}
                  </Link>
                </li>

                {/* Hero Section Editor Link */}
                <li>
                  <Link
                    href="/admin/collections/hero"
                    className={`flex items-center rounded-lg px-4 py-2 text-base font-medium transition-colors ${
                      pathname === "/admin/collections/hero"
                        ? "bg-primary text-white"
                        : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="mr-3">
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
                    {isOpen && <span>Hero Section</span>}
                  </Link>
                </li>

                {/* Services Section Editor Link */}
                <li>
                  <Link
                    href="/admin/collections/services"
                    className={`flex items-center rounded-lg px-4 py-2 text-base font-medium transition-colors ${
                      pathname === "/admin/collections/services"
                        ? "bg-primary text-white"
                        : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="mr-3">
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
                    {isOpen && <span>Service Section</span>}
                  </Link>
                </li>

                {/* About Section Editor Link */}
                <li>
                  <Link
                    href="/admin/collections/about"
                    className={`flex items-center rounded-lg px-4 py-2 text-base font-medium transition-colors ${
                      pathname === "/admin/collections/about"
                        ? "bg-primary text-white"
                        : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="mr-3">
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
                    {isOpen && <span>About Section</span>}
                  </Link>
                </li>

                {/* Clients Section Editor Link */}
                <li>
                  <Link
                    href="/admin/collections/clients"
                    className={`flex items-center rounded-lg px-4 py-2 text-base font-medium transition-colors ${
                      pathname === "/admin/collections/clients"
                        ? "bg-primary text-white"
                        : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="mr-3">
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
                    {isOpen && <span>Client Satisfaction Section</span>}
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* Collection Links - Dynamically Generated */}
          {collections
            .filter(
              (collectionId) =>
                collectionId !== "header" &&
                collectionId !== "hero" &&
                collectionId !== "services" &&
                collectionId !== "about" &&
                collectionId !== "clients",
            )
            .map((collectionId) => (
              <li key={collectionId}>
                <Link
                  href={`/admin/collections/${collectionId}`}
                  className={`flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                    pathname === `/admin/collections/${collectionId}` ||
                    pathname.startsWith(`/admin/collections/${collectionId}/`)
                      ? "bg-primary text-white"
                      : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="mr-3">
                    <CollectionIcon />
                  </div>
                  {isOpen && <span className="capitalize">{collectionId}</span>}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </div>
  );
}
