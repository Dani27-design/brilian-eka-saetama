"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "@/db/firebase/firebaseConfig";

const inter = Inter({ subsets: ["latin"] });

interface UserData {
  uid: string;
  name: string;
  email: string | null;
  role: string;
  isActive: boolean | undefined;
  photoURL?: string; // Tambahkan field photoURL
}
import AdminSidebar from "@/components/Admin/AdminSidebar";
import AdminHeader from "@/components/Admin/AdminHeader";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/app/context/LanguageContext";
import "../../app/globals.css";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
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

  // Authentication check
  useEffect(() => {
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user has proper role in Firestore
          const userDoc = await getDoc(doc(firestore, "users", user.uid));

          if (!userDoc.exists()) {
            // User authenticated but not in Firestore users collection
            await auth.signOut();
            setIsAuthenticated(false);
            router.push("/");
            setTimeout(() => {
              alert("User not found. Please contact an administrator.");
            }, 100);
            return;
          }

          const userDataFromFirestore = userDoc.data();

          // Store user data for passing to other components
          setUserData({
            uid: user.uid,
            name:
              userDataFromFirestore.name ||
              user.displayName ||
              user.email?.split("@")[0],
            email: user.email,
            role: userDataFromFirestore.role,
            isActive: userDataFromFirestore.isActive,
            photoURL: userDataFromFirestore.photoURL || "", // Tambahkan ini
          });

          // Check if user role is admin and account is active
          if (
            userDataFromFirestore.role === "admin" &&
            userDataFromFirestore.isActive !== false
          ) {
            // User is authorized
            setIsAuthenticated(true);
          } else {
            // User doesn't have proper role, sign them out
            await auth.signOut();
            setIsAuthenticated(false);
            router.push("/");
            setTimeout(() => {
              alert(
                "Access denied. You don't have permission to access the admin pages.",
              );
            }, 100);
          }
        } catch (error) {
          console.error("Error checking user permissions:", error);
          await auth.signOut();
          setIsAuthenticated(false);
          router.push("/");
        } finally {
          setIsLoading(false);
        }
      } else {
        // No user is signed in
        setIsAuthenticated(false);
        setUserData(null);
        setIsLoading(false);
        if (!isLoginPage) {
          router.push("/admin/login");
        }
      }
    });

    return () => unsubscribe();
  }, [pathname, router, isLoginPage]);

  // Handle sidebar toggle for desktop
  const handleSidebarToggle = (isOpen: boolean) => {
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

  // Show only authenticated content for admin pages
  if (!isAuthenticated && !isLoginPage) {
    return null; // Router handles redirection in the effect
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
                  userData={userData}
                />
                <div className="flex flex-1 flex-col overflow-hidden">
                  <AdminHeader
                    sidebarOpen={sidebarOpen}
                    onMobileMenuToggle={handleMobileMenuToggle}
                    userData={userData} // Pastikan ini dikirim
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
