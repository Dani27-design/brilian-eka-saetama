"use client";
import { memo } from "react";
import { Blog } from "@/types/blog";
import ScrollReveal from "@/components/ScrollReveal";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/app/context/LanguageContext";

const BlogItem = ({ blog }: { blog: Blog }) => {
  const { mainImage, title, metadata, slug, publishDate, author } = blog;
  const { language } = useLanguage();
  const blogUrl = `/blog/blog-details/${slug || ""}`;

  const formattedDate = publishDate
    ? new Date(publishDate).toLocaleDateString(
        language === "id" ? "id-ID" : "en-US",
        { year: "numeric", month: "short", day: "numeric" }
      )
    : null;

  return (
    <Link href={blogUrl} className="group block">
      <ScrollReveal
        duration={0.5}
        delay={0.2}
        margin="-80px"
        className="animate_top overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-blacksection"
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={mainImage}
            alt={title}
            fill
            priority={false}
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            quality={75}
          />
        </div>

        <div className="p-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {formattedDate && <span>{formattedDate}</span>}
            {formattedDate && author && <span>·</span>}
            {author && <span>{author}</span>}
          </div>
          <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug text-black transition-colors group-hover:text-primary dark:text-white dark:group-hover:text-primary">
            {title}
          </h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-gray-600 dark:text-gray-400">{metadata}</p>
        </div>
      </ScrollReveal>
    </Link>
  );
};

export default memo(BlogItem);
