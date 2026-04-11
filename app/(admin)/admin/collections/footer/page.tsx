"use client";

import CollectionFooter from "@/components/Admin/CollectionFooter";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import { useLanguage } from "@/app/context/LanguageContext";

export default function FooterCollectionPage() {
  const { language } = useLanguage();
  usePageHeader(
    language === "id" ? "Manajemen Website Bagian Footer" : "Footer Section",
    language === "id" ? "Kelola area footer website Anda" : "Manage the footer area of your website",
  );
  return <CollectionFooter collectionName="footer" />;
}
