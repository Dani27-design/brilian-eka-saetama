"use client";

import CollectionContact from "@/components/Admin/CollectionContact";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import { useLanguage } from "@/app/context/LanguageContext";

export default function ContactPage() {
  const { language } = useLanguage();
  usePageHeader(
    language === "id" ? "Manajemen Website Bagian Kontak" : "Contact Section",
    language === "id" ? "Kelola informasi kontak dan pengaturan formulir" : "Manage contact information and form settings",
  );
  return <CollectionContact collectionName="contact" />;
}
