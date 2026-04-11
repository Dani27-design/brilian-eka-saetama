"use client";

import CollectionClients from "@/components/Admin/CollectionClients";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import { useLanguage } from "@/app/context/LanguageContext";

export default function ClientsPage() {
  const { language } = useLanguage();
  usePageHeader(
    language === "id" ? "Manajemen Website Bagian Klien" : "Clients Section",
    language === "id" ? "Kelola logo dan informasi klien" : "Manage client logos and information",
  );
  return <CollectionClients collectionName="clients" />;
}
