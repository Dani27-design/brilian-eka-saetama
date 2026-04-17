"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/db/firebase/firebaseConfig";
import { useAdmin } from "@/app/context/AdminContext";
import { usePageHeaderValue } from "@/app/context/PageHeaderContext";
import Image from "next/image";
import Modal from "./Modal";

export default function AdminHeader({
  sidebarOpen = true,
  onMobileMenuToggle,
  userData,
}) {
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const { signOut: contextSignOut } = useAdmin();
  const { title, subtitle } = usePageHeaderValue();

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);

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
      setIsSigningOut(false);
      setShowSignOutModal(false);
    }
  };

  return (
    <>
      <header
        className={`${
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        } flex min-h-[65px] items-center justify-between border-b border-stroke bg-white px-3 py-3 transition-all duration-300`}
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
          {/* Sign out button */}
          <button
            onClick={() => setShowSignOutModal(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
            title="Keluar"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Sign Out Confirmation Modal */}
      <Modal
        isOpen={showSignOutModal}
        onClose={() => !isSigningOut && setShowSignOutModal(false)}
        title="Konfirmasi Keluar"
        size="sm"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </div>
          <p className="mb-1 text-sm font-medium text-gray-900">
            Anda yakin ingin keluar?
          </p>
          <p className="mb-6 text-xs text-gray-500">
            Anda akan keluar dari sesi admin dan perlu login kembali.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowSignOutModal(false)}
              disabled={isSigningOut}
              className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {isSigningOut && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {isSigningOut ? "Keluar..." : "Ya, Keluar"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
