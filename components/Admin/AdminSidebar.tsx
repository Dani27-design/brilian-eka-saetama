"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";

const translations = {
  id: {
    dashboard: "Statistik Kinerja Website",
    userManagement: "Manajemen Pengguna",
    productManagement: "Manajemen Produk",
    customerManagement: "Manajemen Pelanggan",
    contractManagement: "Manajemen Kontrak",
    maintenanceManagement: "Manajemen Pemeliharaan",
    inspectionManagement: "Manajemen Inspeksi",
    waitingApproval: "Menunggu Approval",
    aparInspection: "Inspeksi APAR",
    hydrantInspection: "Inspeksi Hydrant",
    fireAlarmInspection: "Inspeksi Fire Alarm",
    websiteManagement: "Manajemen Website",
    headerSection: "Bagian Header",
    heroSection: "Bagian Hero",
    serviceSection: "Bagian Layanan",
    aboutSection: "Bagian Tentang Kami",
    clientSatisfactionSection: "Bagian Kepuasan Klien",
    clientListSection: "Bagian Daftar Klien",
    faqSection: "Bagian FAQ",
    testimonialSection: "Bagian Testimoni",
    contactSection: "Bagian Kontak",
    blogSection: "Bagian Blog",
    footerSection: "Bagian Footer",
    blogManagement: "Manajemen Blog",
    mediaLibrary: "Pustaka Media",
    settings: "Pengaturan Akun",
  },
  en: {
    dashboard: "Website Performance Statistics",
    userManagement: "User Management",
    productManagement: "Product Management",
    customerManagement: "Customer Management",
    contractManagement: "Contract Management",
    maintenanceManagement: "Maintenance Management",
    inspectionManagement: "Inspection Management",
    waitingApproval: "Waiting Approval",
    aparInspection: "APAR Inspection",
    hydrantInspection: "Hydrant Inspection",
    fireAlarmInspection: "Fire Alarm Inspection",
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
    settings: "Account Settings",
  },
};

// SVG icon paths (stroke-based, 24x24 viewBox)
const icons = {
  dashboard:
    "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  users:
    "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  products: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  customers:
    "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  contracts:
    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  maintenance:
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  inspection:
    "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  website:
    "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
  blog: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  media:
    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  settings:
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  chevronDown: "M19 9l-7 7-7-7",
};

// Reusable icon component
function Icon({
  path,
  className = "h-5 w-5",
}: {
  path: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={path}
      />
    </svg>
  );
}

// Settings icon needs two paths
function SettingsIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={icons.settings}
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

export default function AdminSidebar({
  onToggle,
  isOpen,
  onClose,
  isMobile,
  userData,
}: {
  onToggle: (isOpen: boolean) => void;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  userData: any;
}) {
  const [websiteContentExpanded, setWebsiteContentExpanded] = useState(false);
  const [inspectionExpanded, setInspectionExpanded] = useState(false);
  const [waitingApprovalCount, setWaitingApprovalCount] = useState<number>(0);
  const pathname = usePathname();
  const { language } = useLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;

  const toggleSidebar = () => onToggle(!isOpen);

  useEffect(() => {
    if (pathname?.includes("/admin/collections/"))
      setWebsiteContentExpanded(true);
    if (pathname?.includes("-inspections") || pathname === "/admin/inspections")
      setInspectionExpanded(true);
  }, []);

  useEffect(() => {
    const q = query(
      collection(firestore, "maintenances"),
      where("status", "==", "waiting_approval")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const count = snapshot.docs.filter((d) => {
        const data = d.data();
        return data.inspection && data.inspection.createdAt;
      }).length;
      setWaitingApprovalCount(count);
    }, (error) => {
      console.error("Error listening to waiting approval count:", error);
    });
    return () => unsubscribe();
  }, []);

  const isActive = (href: string, startsWith?: boolean) => {
    if (!pathname) return false;
    if (pathname === href) return true;
    if (startsWith && pathname.startsWith(href + "/")) return true;
    return false;
  };

  const linkClass = (href: string, startsWith?: boolean) =>
    `flex items-center ${isOpen ? "" : "justify-center"} rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
      isActive(href, startsWith)
        ? "bg-primary text-white"
        : "text-gray-700 hover:bg-blue-50"
    }`;

  const subLinkClass = (href: string) =>
    `flex items-center ${isOpen ? "" : "justify-center"} rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
      isActive(href, true)
        ? "bg-primary text-white"
        : "text-gray-600 hover:bg-blue-50"
    }`;

  // Collection submenu items
  const collectionItems = [
    { href: "/admin/collections/header", label: t.headerSection },
    { href: "/admin/collections/hero", label: t.heroSection },
    { href: "/admin/collections/services", label: t.serviceSection },
    { href: "/admin/collections/about", label: t.aboutSection },
    { href: "/admin/collections/clients", label: t.clientListSection },
    {
      href: "/admin/collections/clientsInfo",
      label: t.clientSatisfactionSection,
    },
    { href: "/admin/collections/faq", label: t.faqSection },
    { href: "/admin/collections/testimonial", label: t.testimonialSection },
    { href: "/admin/collections/contact", label: t.contactSection },
    { href: "/admin/collections/blog", label: t.blogSection },
    { href: "/admin/collections/footer", label: t.footerSection },
  ];

  const inspectionItems = [
    { href: "/admin/inspections", label: t.waitingApproval, badge: waitingApprovalCount },
    { href: "/admin/apar-inspections", label: t.aparInspection },
    { href: "/admin/hydrant-inspections", label: t.hydrantInspection },
    { href: "/admin/fire-alarm-inspections", label: t.fireAlarmInspection },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${isOpen ? "w-64" : "w-20"} ${
          isMobile
            ? `fixed left-0 top-0 z-40 h-screen transform transition-transform duration-300 ${
                isOpen ? "translate-x-0" : "-translate-x-full"
              } lg:hidden`
            : "fixed left-0 top-0 z-40 hidden h-screen transition-all duration-300 ease-in-out lg:block"
        } styled-scrollbar overflow-y-auto border-l-0 border-r-2 border-stroke border-[#bfdbfe] bg-white`}
      >
        {/* Profile Header — mirrors admin header layout */}
        <div className={`relative flex min-h-[65px] items-center ${isOpen ? "gap-3 px-4" : "justify-center px-2"} py-3`}>
          {/* Mobile close */}
          {isMobile && (
            <button
              onClick={onClose}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 hover:bg-blue-50"
            >
              <Icon
                path="M6 18L18 6M6 6l12 12"
                className="h-4 w-4 text-gray-500"
              />
            </button>
          )}

          {/* Avatar — same size as header logo (40px) */}
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-stroke">
            {userData?.photoURL ? (
              <Image
                src={userData.photoURL}
                alt="Profile"
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-blue-50 text-gray-400">
                <Icon
                  path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  className="h-5 w-5"
                />
              </div>
            )}
          </div>

          {/* Name + Email */}
          {isOpen && (
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <div className="truncate text-xl font-semibold leading-tight text-black">
                {userData?.name || "Admin"}
              </div>
              {userData?.email && (
                <p className="mt-0.5 truncate text-xs leading-tight text-gray-400">
                  {userData.email}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="px-3 py-3">
          <ul className="space-y-1">
            {/* Dashboard */}
            <li>
              <Link
                href="/admin/dashboard"
                onClick={isMobile ? onClose : undefined}
                className={linkClass("/admin/dashboard")}
              >
                <div className={isOpen ? "mr-3" : ""}>
                  <Icon path={icons.dashboard} />
                </div>
                {isOpen && <span>{t.dashboard}</span>}
              </Link>
            </li>

            {/* Users */}
            <li>
              <Link
                href="/admin/users"
                onClick={isMobile ? onClose : undefined}
                className={linkClass("/admin/users", true)}
              >
                <div className={isOpen ? "mr-3" : ""}>
                  <Icon path={icons.users} />
                </div>
                {isOpen && <span>{t.userManagement}</span>}
              </Link>
            </li>

            {/* Products */}
            <li>
              <Link
                href="/admin/products"
                onClick={isMobile ? onClose : undefined}
                className={linkClass("/admin/products", true)}
              >
                <div className={isOpen ? "mr-3" : ""}>
                  <Icon path={icons.products} />
                </div>
                {isOpen && <span>{t.productManagement}</span>}
              </Link>
            </li>

            {/* Customers */}
            <li>
              <Link
                href="/admin/customers"
                onClick={isMobile ? onClose : undefined}
                className={linkClass("/admin/customers", true)}
              >
                <div className={isOpen ? "mr-3" : ""}>
                  <Icon path={icons.customers} />
                </div>
                {isOpen && <span>{t.customerManagement}</span>}
              </Link>
            </li>

            {/* Contracts */}
            <li>
              <Link
                href="/admin/contracts"
                onClick={isMobile ? onClose : undefined}
                className={linkClass("/admin/contracts", true)}
              >
                <div className={isOpen ? "mr-3" : ""}>
                  <Icon path={icons.contracts} />
                </div>
                {isOpen && <span>{t.contractManagement}</span>}
              </Link>
            </li>

            {/* Maintenance */}
            <li>
              <Link
                href="/admin/maintenances"
                onClick={isMobile ? onClose : undefined}
                className={linkClass("/admin/maintenances", true)}
              >
                <div className={isOpen ? "mr-3" : ""}>
                  <Icon path={icons.maintenance} />
                </div>
                {isOpen && <span>{t.maintenanceManagement}</span>}
              </Link>
            </li>

            {/* Inspections — Collapsible */}
            <li>
              <button
                onClick={() => setInspectionExpanded(!inspectionExpanded)}
                className={`flex w-full items-center ${isOpen ? "justify-between" : "justify-center"} rounded-lg px-2 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50`}
              >
                <div className="flex items-center">
                  <div className={isOpen ? "mr-3" : ""}>
                    <Icon path={icons.inspection} />
                  </div>
                  {isOpen && <span>{t.inspectionManagement}</span>}
                </div>
                {isOpen && (
                  <Icon
                    path={icons.chevronDown}
                    className={`h-4 w-4 transition-transform ${
                      inspectionExpanded ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
              {inspectionExpanded && (
                <ul className={`mt-1 space-y-0.5 ${isOpen ? "ml-8" : ""}`}>
                  {inspectionItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={isMobile ? onClose : undefined}
                        className={subLinkClass(item.href)}
                      >
                        <div className={isOpen ? "mr-2" : ""}>
                          <div className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                        </div>
                        {isOpen && <span>{item.label}</span>}
                        {isOpen && item.badge !== undefined && (
                          <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>

            {/* Separator */}
            <li className="my-2 border-t border-stroke" />

            {/* Website Management — Collapsible */}
            <li>
              <button
                onClick={() =>
                  setWebsiteContentExpanded(!websiteContentExpanded)
                }
                className={`flex w-full items-center ${isOpen ? "justify-between" : "justify-center"} rounded-lg px-2 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50`}
              >
                <div className="flex items-center">
                  <div className={isOpen ? "mr-3" : ""}>
                    <Icon path={icons.website} />
                  </div>
                  {isOpen && <span>{t.websiteManagement}</span>}
                </div>
                {isOpen && (
                  <Icon
                    path={icons.chevronDown}
                    className={`h-4 w-4 transition-transform ${
                      websiteContentExpanded ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
              {websiteContentExpanded && (
                <ul className={`mt-1 space-y-0.5 ${isOpen ? "ml-8" : ""}`}>
                  {collectionItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={isMobile ? onClose : undefined}
                        className={subLinkClass(item.href)}
                      >
                        <div className={isOpen ? "mr-2" : ""}>
                          <div className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                        </div>
                        {isOpen && <span>{item.label}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>

            {/* Blog */}
            <li>
              <Link
                href="/admin/blogs"
                onClick={isMobile ? onClose : undefined}
                className={linkClass("/admin/blogs", true)}
              >
                <div className={isOpen ? "mr-3" : ""}>
                  <Icon path={icons.blog} />
                </div>
                {isOpen && <span>{t.blogManagement}</span>}
              </Link>
            </li>

            {/* Media */}
            <li>
              <Link
                href="/admin/media"
                onClick={isMobile ? onClose : undefined}
                className={linkClass("/admin/media")}
              >
                <div className={isOpen ? "mr-3" : ""}>
                  <Icon path={icons.media} />
                </div>
                {isOpen && <span>{t.mediaLibrary}</span>}
              </Link>
            </li>

            {/* Separator */}
            <li className="my-2 border-t border-stroke" />

            {/* Settings */}
            <li>
              <Link
                href="/admin/settings"
                onClick={isMobile ? onClose : undefined}
                className={linkClass("/admin/settings")}
              >
                <div className={isOpen ? "mr-3" : ""}>
                  <SettingsIcon />
                </div>
                {isOpen && <span>{t.settings}</span>}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Toggle button — floats on the edge of sidebar, vertical tab style */}
      {!isMobile && (
        <button
          onClick={toggleSidebar}
          className={`fixed top-1/2 z-50 hidden -translate-y-1/2 items-center justify-center rounded-r-lg border-2 border-l-0 border-stroke border-[#bfdbfe] bg-white transition-all duration-300 hover:bg-blue-50 lg:flex ${
            isOpen ? "left-[15.8rem]" : "left-[4.8rem]"
          } h-10 w-5`}
        >
          <svg
            className="h-3.5 w-3.5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
            />
          </svg>
        </button>
      )}
    </>
  );
}
