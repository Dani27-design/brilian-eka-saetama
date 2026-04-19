"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Blog } from "@/types/blog";
import { useLanguage } from "@/app/context/LanguageContext";

const translations = {
  id: {
    relatedArticles: "Artikel Terkait",
    noRelated: "Belum ada artikel terkait",
    readMore: "Baca",
  },
  en: {
    relatedArticles: "Related Articles",
    noRelated: "No related articles",
    readMore: "Read",
  },
};

interface RelatedPostProps {
  relatedPosts?: Blog[];
}

const RelatedPost: React.FC<RelatedPostProps> = ({ relatedPosts = [] }) => {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.id;
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-blacksection">
      <h4 className="mb-4 text-sm font-bold text-black dark:text-white">
        {t.relatedArticles}
      </h4>

      {relatedPosts.length === 0 ? (
        <p className="py-3 text-center text-xs text-gray-400 dark:text-gray-500">{t.noRelated}</p>
      ) : (
        <div className="space-y-3">
          {relatedPosts.map((post, key) => (
            <Link
              key={post._id || key}
              href={`/blog/blog-details/${post.slug || ""}`}
              className="group block overflow-hidden rounded-md border border-gray-100 transition-shadow hover:shadow-sm dark:border-gray-700"
            >
              {/* Thumbnail */}
              {post.mainImage && (
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    fill
                    src={post.mainImage}
                    alt={post.title}
                    loading="lazy"
                    quality={60}
                    sizes="280px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              {/* Info */}
              <div className="p-2.5">
                <h5 className="line-clamp-2 text-xs font-semibold leading-snug text-black transition-colors group-hover:text-primary dark:text-white dark:group-hover:text-primary">
                  {post.title}
                </h5>
                {post.publishDate && (
                  <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                    {new Date(post.publishDate).toLocaleDateString(
                      language === "id" ? "id-ID" : "en-US",
                      { year: "numeric", month: "short", day: "numeric" }
                    )}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RelatedPost;
