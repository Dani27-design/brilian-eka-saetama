"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Blog } from "@/types/blog";

interface RelatedPostProps {
  relatedPosts?: Blog[];
}

const RelatedPost: React.FC<RelatedPostProps> = ({ relatedPosts = [] }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Handle client-side rendering to prevent hydration issues
  if (!hasMounted) {
    return null;
  }

  return (
    <>
      <div className="animate_top rounded-md border border-stroke bg-white p-9 shadow-solid-13 dark:border-strokedark dark:bg-blacksection">
        <h4 className="mb-7.5 text-2xl font-semibold text-black dark:text-white">
          Related Articles
        </h4>

        {relatedPosts.length === 0 ? (
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
                      loading="lazy"
                      quality={70}
                      sizes="180px"
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                      No image
                    </div>
                  )}
                </div>
                <h5 className="text-md font-medium text-black transition-all duration-300 hover:text-primary dark:text-white dark:hover:text-primary">
                  <Link href={`/blog/blog-details/${post.slug || ""}`}>
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
