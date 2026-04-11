"use client";

import CollectionClientsInfo from "@/components/Admin/CollectionClientsInfo";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import { useLanguage } from "@/app/context/LanguageContext";

export default function ClientsInfoCollectionPage() {
  const { language } = useLanguage();
  usePageHeader(
    language === "id" ? "Manajemen Website Bagian Kepuasan Klien" : "Client Satisfaction Section",
    language === "id" ? "Kelola statistik kepuasan klien" : "Manage client satisfaction statistics",
  );
  return <CollectionClientsInfo collectionName="clientsInfo" />;
}
