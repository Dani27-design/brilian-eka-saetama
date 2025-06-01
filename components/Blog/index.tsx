"use client";

import React, { useEffect } from "react";
import SectionHeader from "../Common/SectionHeader";
import BlogItem from "./BlogItem";
import { useLanguage } from "@/app/context/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getData } from "@/actions/read/hero";
import type { Blog } from "@/types/blog";

// Create a hook for fetching blog data from Firestore
const useBlogData = (lang: string, collectionId: string, docId: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: [`${collectionId}-${docId}-${lang}`],
    queryFn: () => getData(lang, collectionId, docId),
    staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
    gcTime: 1000 * 60 * 5, // Data will stay in cache for 5 minutes after it becomes inactive
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchIntervalInBackground: true,
    retry: false,
    initialData: () => {
      return queryClient.getQueryData([`${collectionId}-${docId}-${lang}`]);
    },
  });
};

const Blog = () => {
  const { language } = useLanguage();

  const {
    data: blogTitleData,
    isLoading: isLoadingTitle,
    error: errorTitle,
  } = useBlogData(language, "blog", "blog_title");

  const {
    data: blogSubtitleData,
    isLoading: isLoadingSubtitle,
    error: errorSubtitle,
  } = useBlogData(language, "blog", "blog_subtitle");

  const {
    data: blogDescriptionData,
    isLoading: isLoadingDescription,
    error: errorDescription,
  } = useBlogData(language, "blog", "blog_description");

  const {
    data: blogsData,
    isLoading: isLoadingBlogs,
    error: errorBlogs,
  } = useBlogData(language, "blog", "blogs");

  useEffect(() => {
    if (errorTitle) {
      console.error("Error fetching blog title data:", errorTitle);
    }
    if (errorSubtitle) {
      console.error("Error fetching blog subtitle data:", errorSubtitle);
    }
    if (errorDescription) {
      console.error("Error fetching blog description data:", errorDescription);
    }
    if (errorBlogs) {
      console.error("Error fetching blogs data:", errorBlogs);
    }
  }, [errorTitle, errorSubtitle, errorDescription, errorBlogs]);

  // Default values in case data isn't loaded yet
  let blogTitle = "NEWS & BLOGS";
  let blogSubtitle = "Latest News & Blogs";
  let blogDescription =
    "Stay updated with the latest insights and developments in fire safety, industry trends, and our services.";
  let blogs: Blog[] = [];

  if (blogTitleData) {
    blogTitle = blogTitleData;
  }

  if (blogSubtitleData) {
    blogSubtitle = blogSubtitleData;
  }

  if (blogDescriptionData) {
    blogDescription = blogDescriptionData;
  }

  if (blogsData) {
    blogs = blogsData;
  }

  return (
    <section id="blogs" className="py-10 lg:py-15 xl:py-20">
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
        {isLoadingBlogs ? (
          <div className="py-10 text-center">Loading blog posts...</div>
        ) : (
          <div className="grid grid-cols-1 gap-7.5 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
            {blogs.map((blog, key) => (
              <BlogItem blog={blog} key={blog._id || key} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Blog;
