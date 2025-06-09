"use client";

import { useState, useEffect } from "react";
import RelatedPost from "@/components/Blog/RelatedPost";
import SharePost from "@/components/Blog/SharePost";
import Image from "next/image";
import { useLanguage } from "@/app/context/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { getData } from "@/actions/read/hero";
import type { Blog } from "@/types/blog";

interface BlogDetailClientProps {
  slug: string;
  initialBlog: Blog;
}

const BlogDetailClient = ({ slug, initialBlog }: BlogDetailClientProps) => {
  const { language } = useLanguage();
  const [hasMounted, setHasMounted] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<Blog>(initialBlog);
  const [relatedPosts, setRelatedPosts] = useState<Blog[]>([]);

  // Fetch all blog posts with language context
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
    initialData: [initialBlog], // Provide initial data to prevent loading state
  });

  // Find the current blog and related posts based on slug
  useEffect(() => {
    if (blogsData && slug) {
      const foundBlog = blogsData.find((blog) => blog.slug === slug);
      if (foundBlog) {
        setCurrentBlog(foundBlog);

        // Find related posts (same author or similar topics)
        const related = blogsData
          .filter((blog: Blog) => blog.slug !== slug)
          .slice(0, 3);
        setRelatedPosts(related);
      }
    }
    setHasMounted(true);
  }, [blogsData, slug, language]);

  useEffect(() => {
    if (error) {
      console.error("Error fetching blog data:", error);
    }
  }, [error]);

  // Handle client-side rendering to prevent hydration issues
  if (!hasMounted) {
    return null;
  }

  // Show loading state
  if (isLoading && !currentBlog) {
    return (
      <section className="pb-20 pt-35 lg:pb-25 lg:pt-45 xl:pb-30 xl:pt-50">
        <div className="mx-auto max-w-c-1280 px-4 md:px-8 2xl:px-0">
          <div className="flex h-60 w-full items-center justify-center rounded-md border border-stroke bg-white p-7.5 shadow-solid-13 dark:border-strokedark dark:bg-blacksection">
            <div className="text-xl">Loading blog post...</div>
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
            {/* <div className="animate_top mb-10 rounded-md border border-stroke bg-white p-3.5 shadow-solid-13 dark:border-strokedark dark:bg-blacksection">
              <form
                action="https://formbold.com/s/unique_form_id"
                method="POST"
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Here..."
                    className="w-full rounded-lg border border-stroke px-6 py-4 shadow-solid-12 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black dark:shadow-none dark:focus:border-primary"
                  />

                  <button
                    className="absolute right-0 top-0 p-5"
                    aria-label="search-icon"
                  >
                    <svg
                      className="fill-black transition-all duration-300 hover:fill-primary dark:fill-white dark:hover:fill-primary"
                      width="21"
                      height="21"
                      viewBox="0 0 21 21"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M16.031 14.617L20.314 18.899L18.899 20.314L14.617 16.031C13.0237 17.3082 11.042 18.0029 9 18C4.032 18 0 13.968 0 9C0 4.032 4.032 0 9 0C13.968 0 18 4.032 18 9C18.0029 11.042 17.3082 13.0237 16.031 14.617ZM14.025 13.875C15.2941 12.5699 16.0029 10.8204 16 9C16 5.132 12.867 2 9 2C5.132 2 2 5.132 2 9C2 12.867 5.132 16 9 16C10.8204 16.0029 12.5699 15.2941 13.875 14.025L14.025 13.875Z" />
                    </svg>
                  </button>
                </div>
              </form>
            </div> */}

            {/* <div className="animate_top mb-10 rounded-md border border-stroke bg-white p-9 shadow-solid-13 dark:border-strokedark dark:bg-blacksection">
              <h4 className="mb-7.5 text-2xl font-semibold text-black dark:text-white">
                Categories
              </h4>

              <ul>
                <li className="mb-3 transition-all duration-300 last:mb-0 hover:text-primary">
                  <a href="#">Blog</a>
                </li>
                <li className="mb-3 transition-all duration-300 last:mb-0 hover:text-primary">
                  <a href="#">Events</a>
                </li>
                <li className="mb-3 transition-all duration-300 last:mb-0 hover:text-primary">
                  <a href="#">Grids</a>
                </li>
                <li className="mb-3 transition-all duration-300 last:mb-0 hover:text-primary">
                  <a href="#">News</a>
                </li>
                <li className="mb-3 transition-all duration-300 last:mb-0 hover:text-primary">
                  <a href="#">Rounded</a>
                </li>
              </ul>
            </div> */}

            <RelatedPost relatedPosts={relatedPosts} />
          </div>

          {/* Blog content */}
          <div className="lg:w-2/3">
            <div className="animate_top rounded-md border border-stroke bg-white p-7.5 shadow-solid-13 dark:border-strokedark dark:bg-blacksection md:p-10">
              <div className="mb-10 w-full overflow-hidden">
                <div className="relative aspect-[97/60] w-full sm:aspect-[97/44]">
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

              <h2 className="mb-5 mt-11 text-3xl font-semibold text-black dark:text-white 2xl:text-sectiontitle2">
                {currentBlog.title}
              </h2>

              <ul className="mb-9 flex flex-wrap gap-5 2xl:gap-7.5">
                {currentBlog.author && (
                  <li>
                    <span className="text-black dark:text-white">Author: </span>{" "}
                    {currentBlog.author}
                  </li>
                )}
                {currentBlog.publishDate && (
                  <li>
                    <span className="text-black dark:text-white">
                      Published On:{" "}
                    </span>
                    {new Date(currentBlog.publishDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </li>
                )}
                <li>
                  <span className="text-black dark:text-white">Category: </span>
                  Blog
                </li>
              </ul>

              <div className="blog-content">
                <div
                  dangerouslySetInnerHTML={{
                    __html: currentBlog.content || "",
                  }}
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
