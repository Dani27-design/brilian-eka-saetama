// This is now a Server Component (no "use client" directive)
import { Inter } from "next/font/google";
import "../globals.css";
import AdminLayoutClient from "@/components/Admin/AdminLayoutClient";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: {
    // template: "%s | Admin Dashboard",
    default: "Admin Dashboard",
  },
  description: "Admin dashboard for managing website content",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AdminLayoutClient>{children}</AdminLayoutClient>
      </body>
    </html>
  );
}
