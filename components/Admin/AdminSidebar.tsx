"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";

export default function AdminSidebar({ onToggle }) {
  const [isOpen, setIsOpen] = useState(true);
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
          "hero",
          "about",
          "services",
          "testimonial",
          "blog",
          "faq",
          "footer",
          "contact",
          "clients",
          "clientsInfo",
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
      } fixed left-0 top-0 z-40 h-screen border-r border-stroke bg-white transition-all duration-300 ease-in-out dark:border-strokedark dark:bg-black`}
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
              />
              <Image
                src="/images/logo/logo-dark.png"
                alt="Logo"
                width={40}
                height={40}
                className="hidden dark:block"
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
              />
              <Image
                src="/images/logo/logo-dark.png"
                alt="Logo"
                width={40}
                height={40}
                className="hidden dark:block"
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

      <nav className="mt-8 px-4">
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

          {/* Collection Links - Dynamically Generated */}
          {collections.map((collectionId) => (
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
