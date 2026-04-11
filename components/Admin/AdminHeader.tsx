"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";
import { auth } from "@/db/firebase/firebaseConfig";
import { useAdmin } from "@/app/context/AdminContext";
import { usePageHeaderValue } from "@/app/context/PageHeaderContext";
import Image from "next/image";

export default function AdminHeader({
  sidebarOpen = true,
  onMobileMenuToggle,
  userData,
}) {
  const { language, setLanguage } = useLanguage();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const { signOut: contextSignOut } = useAdmin();
  const { title, subtitle } = usePageHeaderValue();

  const handleSignOut = async () => {
    try {
      // First notify our context that we're signing out
      await contextSignOut();

      // Set sign out flag with a stronger indicator
      localStorage.setItem("isSigningOut", "true");
      localStorage.setItem("signOutTimestamp", Date.now().toString());

      // Perform the actual Firebase sign out
      await signOut(auth);

      // Manually clear the auth state in sessionStorage to prevent flashing
      sessionStorage.removeItem("firebase:authUser:AIza..."); // Replace with your actual Firebase API key

      // Add a delay before navigation to ensure all state changes complete
      setTimeout(() => {
        // Use replace instead of push to prevent back navigation issues
        router.replace("/admin/login?signout=true");
      }, 100);
    } catch (error) {
      console.error("Sign out error:", error);
      localStorage.removeItem("isSigningOut");
      localStorage.removeItem("signOutTimestamp");
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
    <header
      className={`${
        sidebarOpen ? "lg:ml-64" : "lg:ml-20"
      } flex items-center justify-between border-b border-stroke bg-white px-3 py-3 transition-all duration-300`}
    >
      <div className="flex items-center gap-4">
        {/* Mobile hamburger menu */}
        <button
          onClick={onMobileMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 lg:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-black"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Logo + breadcrumb + subtitle */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <Image
            src="/images/logo/logo-light.png"
            alt="Logo"
            width={40}
            height={40}
            priority
            quality={80}
            className="flex-shrink-0"
          />

          {/* Text Content */}
          <div className="flex flex-col justify-center">
            {/* Title */}
            <h1 className="text-xl font-semibold leading-tight text-black">
              {title || "Dashboard"}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p className="mt-0.5 text-sm leading-tight text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Language switcher */}
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-black">
          <button
            onClick={() => setLanguage("en")}
            className={`rounded px-2 py-1 ${
              language === "en" ? "bg-primary text-white" : "hover:bg-gray-100"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("id")}
            className={`rounded px-2 py-1 ${
              language === "id" ? "bg-primary text-white" : "hover:bg-gray-100"
            }`}
          >
            ID
          </button>
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex h-6 w-6 items-center justify-center rounded-full"
            aria-label="Open settings"
          >
            <svg
              fill="#7a7a7a"
              height="20px"
              width="20px"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              stroke="#7a7a7a"
            >
              <g strokeWidth="0"></g>
              <g strokeLinecap="round" strokeLinejoin="round"></g>
              <g>
                <g>
                  <g>
                    <path d="M511.956,308.448L512,206.866l-65.97-7.239c-3.584-12.101-8.323-23.822-14.165-35.037l42.198-52.531l-71.812-71.845 L350.48,81.766c-11.115-6.041-22.751-10.987-34.783-14.783l-7.318-66.961H206.797l-7.21,65.973 c-11.988,3.556-23.608,8.248-34.726,14.021l-52.475-42.265l-71.938,71.72l41.484,51.825c-6.058,11.109-11.02,22.741-14.831,34.763 L0.134,203.29L0,304.872l65.963,7.295c3.573,12.101,8.301,23.826,14.135,35.049L37.856,399.71l71.751,71.907l51.807-41.507 c11.112,6.052,22.744,11.008,34.769,14.815l7.261,66.966l101.582,0.088l7.266-65.967c12.1-3.578,23.826-8.313,35.043-14.149 l52.513,42.22l71.876-71.783l-41.529-51.788c6.046-11.112,10.997-22.747,14.8-34.777L511.956,308.448z M256.021,347.705 c-50.659,0-91.727-41.068-91.727-91.727s41.068-91.727,91.727-91.727c50.659,0,91.727,41.068,91.727,91.727 S306.681,347.705,256.021,347.705z"></path>
                  </g>
                </g>
              </g>
            </svg>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-2 shadow-lg">
              <div className="border-b border-gray-100 px-4 py-2">
                <p className="text-sm font-medium text-gray-800">
                  {userData?.name || "User"}
                </p>
                <p className="text-xs text-gray-500">{userData?.email || ""}</p>
              </div>
              <a
                href="/admin/settings"
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Settings
              </a>
              <button
                onClick={handleSignOut}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
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
