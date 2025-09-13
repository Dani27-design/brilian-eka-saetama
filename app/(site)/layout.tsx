import Footer from "@/components/Site/Footer";
import Header from "@/components/Site/Header"; // This will use the ServerHeader component
import Lines from "@/components/Lines";
import ScrollToTop from "@/components/Site/ScrollToTop";
import { cookies } from "next/headers";
import SchemaMarkup from "@/components/SchemaMarkup";
import { ClientLayoutWrapper } from "./ClientLayoutWrapper";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "PT Brilian Eka Saetama", 
    template: "%s | PT Brilian Eka Saetama"
  },
  description: "PT Brilian Eka Saetama - Your trusted business partner for fire safety equipment and services",
};

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ambil bahasa dari cookie saat server rendering
  const cookieStore = cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "id";

  return (
    <>
      <SchemaMarkup />
      <ClientLayoutWrapper locale={locale}>
        <Lines />
        <Header />
        {/* Skip to content link for accessibility */}
        <a href="#main-content" className="sr-only focus:not-sr-only">
          Skip to content
        </a>
        <main id="main-content">{children}</main>
        <Footer />
        <ScrollToTop />
      </ClientLayoutWrapper>
    </>
  );
}
