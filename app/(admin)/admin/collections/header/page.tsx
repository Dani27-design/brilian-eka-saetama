"use client";

import CollectionHeader from "@/components/Admin/CollectionHeader";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import { useLanguage } from "@/app/context/LanguageContext";

export default function HeaderCollection() {
  const { language } = useLanguage();
  usePageHeader(
    language === "id" ? "Manajemen Website Bagian Header" : "Header Section",
    language === "id" ? "Kelola area header website Anda" : "Manage the header area of your website",
  );
  return <CollectionHeader collectionName="header" />;
}
