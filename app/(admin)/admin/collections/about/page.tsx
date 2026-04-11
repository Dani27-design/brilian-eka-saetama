"use client";

import CollectionAbout from "@/components/Admin/CollectionAbout";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import { useLanguage } from "@/app/context/LanguageContext";

export default function AboutPage() {
  const { language } = useLanguage();
  usePageHeader(
    language === "id" ? "Manajemen Website Bagian Tentang Kami" : "About Section",
    language === "id" ? "Kelola bagian tentang di website Anda" : "Manage the about section of your website",
  );
  return <CollectionAbout collectionName="about" />;
}
