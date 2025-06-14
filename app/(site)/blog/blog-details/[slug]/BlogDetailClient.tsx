"use client";

import { useState, useEffect, useMemo } from "react";
import { marked } from "marked";
import RelatedPost from "@/components/Site/Blog/RelatedPost";
import SharePost from "@/components/Site/Blog/SharePost";
import Image from "next/image";
import { useLanguage } from "@/app/context/LanguageContext";
import type { Blog } from "@/types/blog";

interface BlogDetailClientProps {
  slug: string;
  initialBlog: Blog;
  initialRelatedPosts: Blog[];
  initialLanguage: string;
}

const BlogDetailClient = ({
  slug,
  initialBlog,
  initialRelatedPosts,
  initialLanguage,
}: BlogDetailClientProps) => {
  const { language } = useLanguage();
  const [hasMounted, setHasMounted] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false);

  // Prepare blog data for rendering
  const currentBlog = useMemo(() => initialBlog, [initialBlog]);
  const relatedPosts = useMemo(
    () => initialRelatedPosts,
    [initialRelatedPosts],
  );

  useEffect(() => {
    setHasMounted(true);

    // Simulate minimum loading time for smooth transition
    const timer = setTimeout(() => {
      setIsContentReady(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Function to convert Markdown to HTML
  const renderContent = (content: string) => {
    if (!content) return "";

    try {
      // Check if content is already HTML
      if (content.includes("<") && content.includes(">")) {
        return content; // Already HTML, return as is
      }

      // Convert Markdown to HTML
      return marked.parse(content);
    } catch (error) {
      console.error("Error parsing blog content:", error);
      return content; // Return original content if parsing fails
    }
  };

  // Handle client-side rendering to prevent hydration issues
  if (!hasMounted) {
    return null;
  }

  // Show loading state during brief transition to client
  if (!isContentReady) {
    return (
      <section className="pb-10 pt-25 xl:pt-30">
        <div className="mx-auto max-w-c-1280 px-4 md:px-8 2xl:px-0">
          <div className="flex flex-col-reverse gap-7.5 lg:flex-row xl:gap-12.5">
            <div className="md:w-1/2 lg:w-[32%]">
              <div className="h-64 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="lg:w-2/3">
              <div className="h-96 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pb-10 pt-25 xl:pt-30">
      <div className="mx-auto max-w-c-1280 px-4 md:px-8 2xl:px-0">
        <div className="flex flex-col-reverse gap-7.5 lg:flex-row xl:gap-12.5">
          {/* Sidebar with search, categories and related posts */}
          <div className="md:w-1/2 lg:w-[32%]">
            <RelatedPost relatedPosts={relatedPosts} />
          </div>

          {/* Blog content */}
          <div className="lg:w-2/3">
            <div className="animate_top rounded-md border border-stroke bg-white p-3 shadow-solid-13 dark:border-strokedark dark:bg-blacksection md:p-10">
              <div className="w-full overflow-hidden">
                <div className="relative aspect-[97/60] h-fit w-full sm:aspect-[97/44]">
                  <Image
                    src={currentBlog.mainImage}
                    alt={currentBlog.title}
                    fill
                    className="rounded-md object-cover object-center"
                    priority={true}
                    quality={80}
                  />
                </div>
              </div>

              <h2 className="mt-3 text-2xl font-semibold text-black dark:text-white 2xl:text-sectiontitle2">
                {currentBlog.title}
              </h2>

              <ul className="mb-5 mt-2 flex w-full flex-col justify-between gap-y-1 sm:flex-row md:mb-10 2xl:gap-7.5">
                {currentBlog.author && (
                  <li className="flex items-start">
                    <span className="mr-1 font-medium text-black dark:text-white">
                      {language === "id" ? "Penulis:" : "Author:"}
                    </span>{" "}
                    {currentBlog.author}
                  </li>
                )}
                {currentBlog.publishDate && (
                  <li className="flex items-start">
                    <span className="mr-1 font-medium text-black dark:text-white">
                      {language === "id"
                        ? "Dipublikasikan Pada:"
                        : "Published On:"}{" "}
                    </span>
                    {new Date(currentBlog.publishDate).toLocaleDateString(
                      language === "id" ? "id-ID" : "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </li>
                )}
              </ul>

              <div className="blog-content blog-details">
                <div
                  dangerouslySetInnerHTML={{
                    __html: renderContent(currentBlog.content || ""),
                  }}
                  className="rich-text-content"
                />
              </div>

              <div className="mt-10">
                <SharePost
                  title={currentBlog.title}
                  slug={currentBlog.slug || ""}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogDetailClient;
