"use client";

import { useEffect, useState, useMemo } from "react";
import BlogItem from "@/components/Site/Blog/BlogItem";
import { useLanguage } from "@/app/context/LanguageContext";
import type { Blog } from "@/types/blog";
import PromoSection from "@/components/Site/PromoSection";

// Component for skeleton loading
const SectionLoader = () => (
  <div className="container mx-auto px-4 py-12">
    <div className="grid animate-pulse grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded bg-gray-200 p-4 dark:bg-gray-800">
          <div className="mb-4 h-48 w-full rounded bg-gray-300 dark:bg-gray-700"></div>
          <div className="mb-2 h-8 w-3/4 rounded bg-gray-300 dark:bg-gray-700"></div>
          <div className="h-20 w-full rounded bg-gray-300 dark:bg-gray-700"></div>
        </div>
      ))}
    </div>
  </div>
);

interface BlogPageClientProps {
  initialData: Blog[];
  initialLanguage: string;
}

const BlogPageClient = ({
  initialData,
  initialLanguage,
}: BlogPageClientProps) => {
  const { language } = useLanguage();
  const [hasMounted, setHasMounted] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false);

  // Mark when component is mounted on client
  useEffect(() => {
    setHasMounted(true);

    // Simulate minimum loading time for smooth transition
    const timer = setTimeout(() => {
      setIsContentReady(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Prepare blogs data
  const blogs = useMemo(() => {
    return initialData || [];
  }, [initialData]);

  // Handle client-side rendering to prevent hydration issues
  if (!hasMounted) {
    return null;
  }

  // Show loading state during brief transition to client
  if (!isContentReady) {
    return <SectionLoader />;
  }

  return (
    <>
      {/* <!-- ===== Blog Start ===== --> */}
      <section className="py-10">
        <div className="mx-auto mt-15 max-w-c-1280 px-4 md:px-8 xl:mt-20 xl:px-0">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Left sidebar — vertical promo (sticky on desktop) */}
            <div className="order-2 lg:order-1 lg:w-[240px] lg:flex-shrink-0">
              <div className="lg:sticky lg:top-24">
                <PromoSection variant="trust" vertical />
              </div>
            </div>

            {/* Blog grid */}
            <div className="order-1 flex-1 lg:order-2">
              {blogs.length === 0 ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="text-xl text-gray-600 dark:text-gray-400">
                    {language === "id"
                      ? "Tidak ada postingan blog"
                      : "No blog posts available"}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {blogs.map((post, key) => (
                    <BlogItem key={post._id || key} blog={post} />
                  ))}
                </div>
              )}

              {/* Bottom promotion */}
              <PromoSection variant="services" className="mt-12" />
            </div>
          </div>
        </div>
      </section>
      {/* <!-- ===== Blog End ===== --> */}
    </>
  );
};

export default BlogPageClient;
