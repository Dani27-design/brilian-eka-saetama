"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface MenuItem {
  title: string;
  path: string;
  icon: JSX.Element;
}

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      path: "/admin/dashboard",
      icon: (
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
      ),
    },
    {
      title: "Hero",
      path: "/admin/collections/hero",
      icon: (
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
      ),
    },
    {
      title: "About",
      path: "/admin/collections/about",
      icon: (
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
      ),
    },
    {
      title: "Services",
      path: "/admin/collections/services",
      icon: (
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
      ),
    },
    {
      title: "Testimonials",
      path: "/admin/collections/testimonial",
      icon: (
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
      ),
    },
    {
      title: "Blog",
      path: "/admin/collections/blog",
      icon: (
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
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
      ),
    },
    {
      title: "FAQ",
      path: "/admin/collections/faq",
      icon: (
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
      ),
    },
    {
      title: "Footer",
      path: "/admin/collections/footer",
      icon: (
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
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      className={`${
        isOpen ? "w-64" : "w-20"
      } fixed left-0 top-0 z-50 h-full bg-white transition-width duration-300 ease-in-out dark:bg-black`}
    >
      <div className="flex h-16 items-center justify-between px-4">
        {isOpen ? (
          <Link href="/admin/dashboard">
            <div className="flex items-center">
              <Image
                src="/images/logo/logo-light.svg"
                alt="Logo"
                width={40}
                height={40}
                className="dark:hidden"
              />
              <Image
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={40}
                height={40}
                className="hidden dark:block"
              />
              <h1 className="ml-2 text-xl font-bold text-black dark:text-white">
                Admin
              </h1>
            </div>
          </Link>
        ) : (
          <Link href="/admin/dashboard">
            <Image
              src="/images/logo/logo-light.svg"
              alt="Logo"
              width={40}
              height={40}
              className="dark:hidden"
            />
            <Image
              src="/images/logo/logo-dark.svg"
              alt="Logo"
              width={40}
              height={40}
              className="hidden dark:block"
            />
          </Link>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
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
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                  pathname === item.path || pathname.startsWith(`${item.path}/`)
                    ? "bg-primary text-white"
                    : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                }`}
              >
                <div className="mr-3">{item.icon}</div>
                {isOpen && <span>{item.title}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
