"use client";

import React, { useEffect, useState, useMemo } from "react";
import SectionHeader from "../Common/SectionHeader";
import BlogItem from "./BlogItem";
import { useLanguage } from "@/app/context/LanguageContext";
import Link from "next/link";
import SectionHeaderSkeleton from "../Skeleton/SectionHeaderSkeleton";
import type { Blog } from "@/types/blog";

// Interface for blog data from server
interface BlogServerData {
  blog_title: string;
  blog_subtitle: string;
  blog_description: string;
  blogs: Blog[];
}

interface BlogProps {
  initialData: BlogServerData;
  initialLanguage: string;
}

const ClientBlog = ({ initialData, initialLanguage }: BlogProps) => {
  const { language } = useLanguage();
  const [isClient, setIsClient] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false);

  // Mark when component is mounted on client
  useEffect(() => {
    setIsClient(true);

    // Simulate minimum loading time for smooth transition
    const timer = setTimeout(() => {
      setIsContentReady(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Prepare data for rendering
  const { blogTitle, blogSubtitle, blogDescription, blogs } = useMemo(() => {
    return {
      blogTitle: initialData.blog_title || "NEWS & BLOGS",
      blogSubtitle: initialData.blog_subtitle || "Latest News & Blogs",
      blogDescription:
        initialData.blog_description ||
        "Stay updated with the latest insights and developments in fire safety, industry trends, and our services.",
      blogs: initialData.blogs || [],
    };
  }, [initialData]);

  // Show loading state during brief transition to client
  if (isClient && !isContentReady) {
    return (
      <section id="blogs" className="my-0 py-4">
        <div className="mx-auto max-w-c-1280 px-4 md:px-8 xl:px-0">
          <SectionHeaderSkeleton />
        </div>

        <div className="mx-auto mt-15 max-w-c-1280 px-4 md:px-8 xl:mt-20 xl:px-0">
          <div className="grid grid-cols-1 gap-7.5 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg bg-white p-4 shadow-solid-8 dark:bg-blacksection"
              >
                <div className="aspect-[368/239] w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mt-5 h-4 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mt-3.5 h-6 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mt-3.5 h-16 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="blogs" className="my-0 py-4">
      <div className="mx-auto max-w-c-1280 px-4 md:px-8 xl:px-0">
        {/* <!-- Section Title Start --> */}
        <div className="animate_top mx-auto text-center">
          <SectionHeader
            headerInfo={{
              title: blogTitle,
              subtitle: blogSubtitle,
              description: blogDescription,
            }}
          />
        </div>
        {/* <!-- Section Title End --> */}
      </div>

      <div className="mx-auto mt-15 max-w-c-1280 px-4 md:px-8 xl:mt-20 xl:px-0">
        {blogs.length === 0 ? (
          <div className="py-10 text-center">
            {language === "id"
              ? "Belum ada postingan blog tersedia."
              : "No blog posts available."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7.5 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
            {blogs.slice(0, 3).map((blog, key) => (
              <BlogItem blog={blog} key={blog._id || key} />
            ))}
          </div>
        )}

        {blogs.length > 3 && (
          <div className="mt-5 text-center">
            <Link
              href="/blog"
              className="inline-block rounded-lg bg-[#006bff] px-6 py-3 text-white transition-colors duration-300 dark:hover:bg-[#0056d2] dark:hover:text-white"
            >
              {language === "id" ? "Blog Lainnya" : "More Blogs"}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default ClientBlog;
