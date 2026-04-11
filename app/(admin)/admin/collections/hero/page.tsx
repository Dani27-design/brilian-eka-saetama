"use client";

import CollectionHero from "@/components/Admin/CollectionHero";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import { useLanguage } from "@/app/context/LanguageContext";

export default function HeroCollection() {
  const { language } = useLanguage();
  usePageHeader(
    language === "id" ? "Manajemen Website Bagian Hero" : "Hero Section",
    language === "id" ? "Kelola banner utama website Anda" : "Manage the hero banner of your website",
  );
  return <CollectionHero collectionName="hero" />;
}
