"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/db/firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import AdminSidebar from "@/components/Admin/AdminSidebar";
import AdminHeader from "@/components/Admin/AdminHeader";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/app/context/LanguageContext";
import { Inter } from "next/font/google";
import "../../app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setIsLoading(false);
        // If user is on login page and already authenticated, redirect to dashboard
        if (isLoginPage) {
          router.push("/admin/dashboard");
        }
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
        // If not on login page and not authenticated, redirect to login
        if (!isLoginPage) {
          router.push("/admin/login");
        }
      }
    });

    return () => unsubscribe();
  }, [pathname, router, isLoginPage]);

  // Handle sidebar toggle for desktop
  const handleSidebarToggle = (isOpen) => {
    setSidebarOpen(isOpen);
  };

  // Handle mobile menu toggle
  const handleMobileMenuToggle = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  // Handle mobile sidebar close
  const handleMobileSidebarClose = () => {
    setMobileSidebarOpen(false);
  };

  // Special case for login page - render without admin components
  if (isLoginPage) {
    return (
      <html lang="id">
        <body className={inter.className}>
          <ThemeProvider attribute="class">
            <LanguageProvider>{children}</LanguageProvider>
          </ThemeProvider>
        </body>
      </html>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <html lang="id">
        <body className={inter.className}>
          <div className="flex h-screen w-full items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </body>
      </html>
    );
  }

  // Admin layout with sidebar and header
  return (
    <html lang="id">
      <body className={inter.className}>
        {isAuthenticated && (
          <ThemeProvider attribute="class">
            <LanguageProvider>
              <div className="flex h-screen bg-gray-50 dark:bg-blacksection">
                <AdminSidebar
                  onToggle={handleSidebarToggle}
                  isOpen={isMobile ? mobileSidebarOpen : sidebarOpen}
                  onClose={handleMobileSidebarClose}
                  isMobile={isMobile}
                />
                <div className="flex flex-1 flex-col overflow-hidden">
                  <AdminHeader
                    sidebarOpen={sidebarOpen}
                    onMobileMenuToggle={handleMobileMenuToggle}
                  />
                  <main
                    className={`${
                      !isMobile && sidebarOpen
                        ? "lg:ml-64"
                        : !isMobile
                        ? "lg:ml-20"
                        : ""
                    } flex-1 overflow-y-auto p-2 transition-all duration-300 md:p-4 lg:p-6 xl:p-8`}
                  >
                    {children}
                  </main>
                </div>
              </div>
            </LanguageProvider>
          </ThemeProvider>
        )}
      </body>
    </html>
  );
}
