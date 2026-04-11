"use client";

import CollectionBlog from "@/components/Admin/CollectionBlog";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import { useLanguage } from "@/app/context/LanguageContext";

export default function BlogCollectionPage() {
  const { language } = useLanguage();
  usePageHeader(
    language === "id" ? "Manajemen Website Bagian Blog" : "Blog Section",
    language === "id" ? "Kelola tata letak bagian blog di website Anda" : "Manage the blog section layout on your website",
  );
  return <CollectionBlog collectionName="blog" />;
}
