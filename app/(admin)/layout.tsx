import { Inter } from "next/font/google";
import "../globals.css";
import { LanguageProvider } from "../context/LanguageContext";
import { AdminProvider } from "../context/AdminContext";
import AdminLayoutClient from "@/components/Admin/AdminLayoutClient";
import { Providers } from "../providers";

export const metadata = {
  title: "Admin Dashboard | PT Brilian Eka Saetama",
  description: "Admin dashboard untuk mengelola konten website",
};

const inter = Inter({ subsets: ["latin"] });

// Note: metadata can't be used in Client Components
// You'll need to define metadata in a separate layout file or use other methods

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Serahkan semua rendering ke AdminLayoutClient
  return (
    <html lang="id">
      <body className={inter.className}>
        <LanguageProvider>
          <AdminProvider>
            <Providers>
              <AdminLayoutClient>{children}</AdminLayoutClient>
            </Providers>
          </AdminProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
