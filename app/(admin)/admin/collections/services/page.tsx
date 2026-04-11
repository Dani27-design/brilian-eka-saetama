"use client";

import CollectionServices from "@/components/Admin/CollectionServices";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import { useLanguage } from "@/app/context/LanguageContext";

export default function ServicesPage() {
  const { language } = useLanguage();
  usePageHeader(
    language === "id" ? "Manajemen Website Bagian Layanan" : "Services Section",
    language === "id" ? "Kelola layanan yang ditampilkan di website Anda" : "Manage the services displayed on your website",
  );
  return <CollectionServices collectionName="services" />;
}
