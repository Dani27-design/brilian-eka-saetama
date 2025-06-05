"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/app/context/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { getData } from "@/actions/read/hero";
import type { Blog } from "@/types/blog";

const RelatedPost = () => {
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (error) {
      console.error("Error fetching related posts:", error);
    }
    setHasMounted(true);
  }, [error]);

  // Handle client-side rendering to prevent hydration issues
  if (!hasMounted) {
    return null;
  }

  // Default empty array in case data isn't loaded yet
  const posts: Blog[] = blogsData || [];

  // Only show up to 3 related posts
  const relatedPosts = posts.slice(0, 3);

  return (
    <>
      <div className="animate_top rounded-md border border-stroke bg-white p-9 shadow-solid-13 dark:border-strokedark dark:bg-blacksection">
        <h4 className="mb-7.5 text-2xl font-semibold text-black dark:text-white">
          Related Posts
        </h4>

        {isLoading ? (
          <div className="py-5 text-center">Loading related posts...</div>
        ) : relatedPosts.length === 0 ? (
          <div className="py-5 text-center">No related posts available</div>
        ) : (
          <div>
            {relatedPosts.map((post, key) => (
              <div
                className="mb-7.5 flex flex-wrap gap-4 xl:flex-nowrap 2xl:gap-6"
                key={post._id || key}
              >
                <div className="max-w-45 relative h-18 w-45">
                  {post.mainImage ? (
                    <Image
                      fill
                      src={post.mainImage}
                      alt={post.title}
                      priority={true} // For above-the-fold images
                      quality={80} // Balance between quality and size
                      loading="eager" // For critical images
                      sizes="180px" // Added sizes attribute based on parent container dimensions
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                      No image
                    </div>
                  )}
                </div>
                <h5 className="text-md font-medium text-black transition-all duration-300 hover:text-primary dark:text-white dark:hover:text-primary">
                  <Link href={`/blog/${post.slug || ""}`}>
                    {post.title.length > 40
                      ? `${post.title.slice(0, 40)}...`
                      : post.title}
                  </Link>
                </h5>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default RelatedPost;
