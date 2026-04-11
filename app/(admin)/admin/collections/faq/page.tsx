"use client";

import CollectionFAQ from "@/components/Admin/CollectionFAQ";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import { useLanguage } from "@/app/context/LanguageContext";

export default function FAQCollectionPage() {
  const { language } = useLanguage();
  usePageHeader(
    language === "id" ? "Manajemen Website Bagian FAQ" : "FAQ Section",
    language === "id" ? "Kelola pertanyaan yang sering diajukan" : "Manage frequently asked questions",
  );
  return <CollectionFAQ collectionName="faq" />;
}
