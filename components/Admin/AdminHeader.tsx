"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useLanguage } from "@/app/context/LanguageContext";
import { auth } from "@/db/firebase/firebaseConfig";

export default function AdminHeader() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/admin/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <header className="ml-64 flex h-16 items-center justify-between border-b border-stroke px-6 dark:border-strokedark">
      <div className="flex items-center">
        <h1 className="text-lg font-medium text-black dark:text-white">
          Admin Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Language switcher */}
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-black dark:text-white">
          <button
            onClick={() => setLanguage("en")}
            className={`rounded px-2 py-1 ${
              language === "en"
                ? "bg-primary text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("id")}
            className={`rounded px-2 py-1 ${
              language === "id"
                ? "bg-primary text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            ID
          </button>
        </div>

        {/* Theme switcher */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {theme === "dark" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
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
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-500"
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
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-2 shadow-lg dark:bg-gray-800">
              <button
                onClick={handleSignOut}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
