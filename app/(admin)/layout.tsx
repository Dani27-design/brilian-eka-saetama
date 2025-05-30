"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import "../globals.css";
import { auth } from "@/db/firebase/firebaseConfig";

const inter = Inter({ subsets: ["latin"] });

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === "/admin/login") {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Redirect to login if not authenticated
        router.push("/admin/login");
      } else {
        // User is authenticated, allow access
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  // Special case for login page - render without admin components
  if (pathname === "/admin/login") {
    return (
      <html lang="en">
        <body className={inter.className}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
          </ThemeProvider>
        </body>
      </html>
    );
  }

  if (isLoading) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <div className="flex h-screen w-full items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
