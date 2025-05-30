"use client";

import { useEffect, useState } from "react";
import BlogItem from "@/components/Blog/BlogItem";
import { useLanguage } from "@/app/context/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { getData } from "@/actions/read/hero";
import type { Blog } from "@/types/blog";

const BlogPage = () => {
  const { language } = useLanguage();
  const [hasMounted, setHasMounted] = useState(false);

  // Fetch blog data from Firestore
  const {
    data: blogsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`blog-blogs-${language}`],
    queryFn: () => getData(language, "blog", "blogs"),
    staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
    gcTime: 1000 * 60 * 5, // Data will stay in cache for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (error) {
      console.error("Error fetching blog data:", error);
    }
    setHasMounted(true);
  }, [error]);

  // Handle client-side rendering to prevent hydration issues
  if (!hasMounted) {
    return null;
  }

  // Default empty array in case data isn't loaded yet
  const blogs: Blog[] = blogsData || [];

  return (
    <>
      {/* <!-- ===== Blog Grid Start ===== --> */}
      <section className="py-20 lg:py-25 xl:py-30">
        <div className="mx-auto mt-15 max-w-c-1280 px-4 md:px-8 xl:mt-20 xl:px-0">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="text-xl">Loading blog posts...</div>
            </div>
          ) : blogs.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
              <div className="text-xl">No blog posts available</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-7.5 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
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

export default BlogPage;
