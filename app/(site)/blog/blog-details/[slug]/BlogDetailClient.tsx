"use client";

import { useState, useEffect, useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import RelatedPost from "@/components/Site/Blog/RelatedPost";
import SharePost from "@/components/Site/Blog/SharePost";
import Image from "next/image";
import { useLanguage } from "@/app/context/LanguageContext";
import type { Blog } from "@/types/blog";
import PromoSection from "@/components/Site/PromoSection";

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
  const [renderedContent, setRenderedContent] = useState("");

  // Prepare blog data for rendering
  const currentBlog = useMemo(() => initialBlog, [initialBlog]);
  const relatedPosts = useMemo(
    () => initialRelatedPosts,
    [initialRelatedPosts],
  );

  useEffect(() => {
    setHasMounted(true);

    // Render content asynchronously
    const renderContentAsync = async () => {
      const content = currentBlog.content || "";
      if (!content) {
        setRenderedContent("");
        return;
      }

      try {
        // Check if content is already HTML
        if (content.includes("<") && content.includes(">")) {
          setRenderedContent(DOMPurify.sanitize(content));
        } else {
          // Convert Markdown to HTML
          const htmlContent = await marked.parse(content);
          setRenderedContent(DOMPurify.sanitize(htmlContent));
        }
      } catch (error) {
        console.error("Error parsing blog content:", error);
        setRenderedContent(DOMPurify.sanitize(content));
      }
    };

    renderContentAsync();

    // Simulate minimum loading time for smooth transition
    const timer = setTimeout(() => {
      setIsContentReady(true);
    }, 200);

    return () => clearTimeout(timer);
  }, [currentBlog.content]);


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
    <section className="pb-16 pt-25 xl:pt-30">
      <div className="mx-auto max-w-c-1280 px-4 md:px-8 2xl:px-0">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left sidebar — promo + related articles */}
          <div className="order-2 lg:order-1 lg:w-[220px] lg:flex-shrink-0">
            <div className="space-y-4 lg:sticky lg:top-24">
              <PromoSection variant="trust" vertical />
              {relatedPosts.length > 0 && (
                <RelatedPost relatedPosts={relatedPosts} />
              )}
            </div>
          </div>

          {/* Article — centered, readable width */}
          <div className="order-1 min-w-0 flex-1 lg:order-2 lg:max-w-3xl">
            {/* Meta — above image */}
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {currentBlog.author && <span>{currentBlog.author}</span>}
              {currentBlog.author && currentBlog.publishDate && <span>·</span>}
              {currentBlog.publishDate && (
                <span>
                  {new Date(currentBlog.publishDate).toLocaleDateString(
                    language === "id" ? "id-ID" : "en-US",
                    { year: "numeric", month: "long", day: "numeric" },
                  )}
                </span>
              )}
            </div>

            {/* Hero image */}
            <div className="relative aspect-[21/9] overflow-hidden rounded-lg">
              <Image
                src={currentBlog.mainImage}
                alt={currentBlog.title}
                fill
                className="object-cover"
                priority={true}
                quality={80}
              />
            </div>

            {/* Content */}
            <div className="mt-8 blog-content blog-details">
              <div
                dangerouslySetInnerHTML={{ __html: renderedContent }}
                className="rich-text-content"
              />
            </div>

            {/* Share */}
            <div className="mt-10 border-t border-gray-200 pt-6 dark:border-gray-700">
              <SharePost
                title={currentBlog.title}
                slug={currentBlog.slug || ""}
              />
            </div>

            {/* Bottom Promotion */}
            <PromoSection variant="trust" className="mt-10" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogDetailClient;
