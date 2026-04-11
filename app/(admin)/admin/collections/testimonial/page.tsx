"use client";

import CollectionTestimonial from "@/components/Admin/CollectionTestimonial";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import { useLanguage } from "@/app/context/LanguageContext";

export default function TestimonialCollectionPage() {
  const { language } = useLanguage();
  usePageHeader(
    language === "id" ? "Manajemen Website Bagian Testimoni" : "Testimonial Section",
    language === "id" ? "Kelola testimoni klien" : "Manage client testimonials",
  );
  return <CollectionTestimonial collectionName="testimonial" />;
}
