// This is now a Server Component (no "use client" directive)
import { Inter } from "next/font/google";
import "../globals.css";
import AdminLayoutClient from "@/components/Admin/AdminLayoutClient";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: {
    default: "Admin Dashboard | PT Brilian Eka Saetama",
  },
  description: "Admin dashboard for managing website content",
  applicationName: "Admin Dashboard PT Brilian Eka Saetama",
  icons: {
    icon: "/images/favicon.ico",
    apple: "/images/favicon.ico",
    shortcut: "/images/favicon.ico",
    other: [
      {
        rel: "apple-touch-icon",
        url: "/images/favicon.ico",
      },
      {
        rel: "mask-icon",
        url: "/images/favicon.ico",
        color: "#000000",
      },
    ],
  },
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
