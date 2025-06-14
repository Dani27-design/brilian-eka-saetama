"use client";

import { useEffect, useState, useMemo } from "react";
import BlogItem from "@/components/Site/Blog/BlogItem";
import { useLanguage } from "@/app/context/LanguageContext";
import type { Blog } from "@/types/blog";

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
      {/* <!-- ===== Blog Grid Start ===== --> */}
      <section className="py-10">
        <div className="mx-auto mt-15 max-w-c-1280 px-4 md:px-8 xl:mt-20 xl:px-0">
          {blogs.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
              <div className="text-xl">
                {language === "id"
                  ? "Tidak ada postingan blog"
                  : "No blog posts available"}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {blogs.map((post, key) => (
                <BlogItem key={post._id || key} blog={post} />
              ))}
            </div>
          )}
        </div>
      </section>
      {/* <!-- ===== Blog Grid End ===== --> */}
    </>
  );
};

export default BlogPageClient;
