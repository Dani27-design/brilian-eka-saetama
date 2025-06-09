"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useLanguage } from "@/app/context/LanguageContext";
import { Blog } from "@/types/blog";

interface BlogPreviewProps {
  data: {
    [key: string]: {
      [lang: string]: any;
    };
  };
  activeSection: string | null;
  onEditSection?: (section: string) => void;
  previewMode?: "desktop" | "mobile";
  onPreviewModeChange?: (mode: "desktop" | "mobile") => void;
}

const BlogPreview = ({
  data,
  activeSection,
  onEditSection,
  previewMode = "desktop",
  onPreviewModeChange,
}: BlogPreviewProps) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [internalPreviewMode, setInternalPreviewMode] = useState<
    "desktop" | "mobile"
  >(previewMode);

  // Use internal state if no external control is provided
  const currentPreviewMode = onPreviewModeChange
    ? previewMode
    : internalPreviewMode;

  const handlePreviewModeChange = (mode: "desktop" | "mobile") => {
    if (onPreviewModeChange) {
      onPreviewModeChange(mode);
    } else {
      setInternalPreviewMode(mode);
    }
  };

  // Process the blog data for the current language
  const processBlogData = () => {
    const currentLang = language || "en";

    // Get blog title
    const getBlogTitle = () => {
      if (!data.blog_title || !data.blog_title[currentLang]) {
        return currentLang === "en" ? "NEWS & BLOGS" : "BERITA & BLOG";
      }
      return data.blog_title[currentLang];
    };

    // Get blog subtitle
    const getBlogSubtitle = () => {
      if (!data.blog_subtitle || !data.blog_subtitle[currentLang]) {
        return currentLang === "en"
          ? "Latest News & Blogs"
          : "Berita & Blog Terbaru";
      }
      return data.blog_subtitle[currentLang];
    };

    // Get blog description
    const getBlogDescription = () => {
      if (!data.blog_description || !data.blog_description[currentLang]) {
        return currentLang === "en"
          ? "Stay updated with the latest insights and developments in fire safety, industry trends, and our services."
          : "Tetap update dengan informasi terbaru tentang keamanan kebakaran, tren industri, dan layanan kami.";
      }
      return data.blog_description[currentLang];
    };

    // Get blog items
    const getBlogItems = () => {
      try {
        if (!data.blogs || !data.blogs[currentLang]) return [];
        const blogs = data.blogs[currentLang];
        return Array.isArray(blogs) ? blogs : [];
      } catch (e) {
        console.error("Error parsing blog items:", e);
        return [];
      }
    };

    const blogTitle = getBlogTitle();
    const blogSubtitle = getBlogSubtitle();
    const blogDescription = getBlogDescription();
    const blogItems = getBlogItems();

    return {
      blogTitle,
      blogSubtitle,
      blogDescription,
      blogItems,
    };
  };

  const blogContent = processBlogData();

  // Render individual blog item
  const renderBlogItem = (blog: Blog, key: number) => {
    return (
      <div
        className="animate_top rounded-lg bg-white p-4 pb-9 shadow-solid-8 dark:bg-blacksection"
        key={key}
      >
        <div className="relative block aspect-[368/239]">
          {blog.mainImage ? (
            <Image
              src={blog.mainImage}
              alt={blog.title || "Blog image"}
              fill
              className="rounded-lg object-cover"
              quality={50}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              No Image
            </div>
          )}
        </div>

        <div className="px-4">
          <h3 className="mb-3.5 mt-7.5 line-clamp-2 inline-block text-lg font-medium text-black duration-300 hover:text-primary dark:text-white dark:hover:text-primary xl:text-itemtitle2">
            {blog.title && blog.title.length > 40
              ? `${blog.title.slice(0, 40)}...`
              : blog.title || "Blog Title"}
          </h3>
          <p className="line-clamp-3">{blog.metadata || "Blog description"}</p>
        </div>
      </div>
    );
  };

  // Render blog content for device frames
  const renderBlogContent = () => (
    <div className="mx-auto w-full py-4">
      <div className="mx-auto w-full px-0">
        {/* Section Header with Title and Subtitle */}
        <div className="mx-auto text-center">
          <div
            className="relative mb-4 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              activeSection !== "blog_title" &&
                onEditSection &&
                onEditSection("blog_title");
            }}
            onMouseEnter={() => setHoveredSection("blog_title")}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <div className="inline-block rounded-full bg-zumthor px-4.5 py-1.5 dark:border dark:border-strokedark dark:bg-blacksection">
              <span className="text-sectiontitle font-medium text-black dark:text-white">
                {blogContent.blogTitle}
              </span>
            </div>

            {(hoveredSection === "blog_title" ||
              activeSection === "blog_title") && (
              <>
                <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
                <div className="absolute -top-0 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                  Blog Title (Click to Edit)
                </div>
              </>
            )}
          </div>

          <div
            className="relative mb-4 w-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              activeSection !== "blog_subtitle" &&
                onEditSection &&
                onEditSection("blog_subtitle");
            }}
            onMouseEnter={() => setHoveredSection("blog_subtitle")}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <h2
              className={`font-bold text-black dark:text-white ${
                currentPreviewMode === "mobile" ? "text-lg" : "text-xl"
              }`}
            >
              {blogContent.blogSubtitle}
            </h2>

            {(hoveredSection === "blog_subtitle" ||
              activeSection === "blog_subtitle") && (
              <>
                <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
                <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                  Blog Subtitle (Click to Edit)
                </div>
              </>
            )}
          </div>

          <div
            className="relative mb-10 w-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              activeSection !== "blog_description" &&
                onEditSection &&
                onEditSection("blog_description");
            }}
            onMouseEnter={() => setHoveredSection("blog_description")}
            onMouseLeave={() => setHoveredSection(null)}
          >
            <p
              className={`text-body-color mx-auto font-medium leading-relaxed ${
                currentPreviewMode === "mobile"
                  ? "w-full text-sm"
                  : "max-w-c-665 text-base"
              }`}
            >
              {blogContent.blogDescription}
            </p>

            {(hoveredSection === "blog_description" ||
              activeSection === "blog_description") && (
              <>
                <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
                <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                  Blog Description (Click to Edit)
                </div>
              </>
            )}
          </div>
        </div>

        {/* Blog Items */}
        <div
          className="relative cursor-pointer text-sm"
          onClick={(e) => {
            e.stopPropagation();
            activeSection !== "blogs" &&
              onEditSection &&
              onEditSection("blogs");
          }}
          onMouseEnter={() => setHoveredSection("blogs")}
          onMouseLeave={() => setHoveredSection(null)}
        >
          {blogContent.blogItems.length > 0 ? (
            <div
              className={`grid gap-7.5 ${
                currentPreviewMode === "mobile"
                  ? "grid-cols-1"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {blogContent.blogItems.map((blog, index) =>
                renderBlogItem(blog, index),
              )}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <span className="mb-3 text-3xl">➕</span>
              <p>Add blog posts to display here</p>
            </div>
          )}

          {(hoveredSection === "blogs" || activeSection === "blogs") && (
            <>
              <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
              <div className="absolute -top-8 left-0 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                Blog Posts (Click to Edit)
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-lg border bg-white p-6 dark:bg-black">
      {/* Active section indicator */}
      {activeSection && (
        <div className="mb-3 rounded-md bg-primary/10 p-2 text-center shadow-sm">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
            <span className="text-sm font-medium text-primary">
              {activeSection === "blog_title" ? (
                <span>Editing Title</span>
              ) : activeSection === "blog_subtitle" ? (
                <span>Editing Subtitle</span>
              ) : activeSection === "blog_description" ? (
                <span>Editing Description</span>
              ) : (
                <span>Editing Blog Posts</span>
              )}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Click on other sections to edit them
          </p>
        </div>
      )}

      {/* Preview mode toggle buttons */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-black dark:text-white">
          Blog Section
        </h2>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => handlePreviewModeChange("desktop")}
            className={`rounded-md px-3 py-1 text-sm ${
              currentPreviewMode === "desktop"
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            Desktop
          </button>
          <button
            type="button"
            onClick={() => handlePreviewModeChange("mobile")}
            className={`rounded-md px-3 py-1 text-sm ${
              currentPreviewMode === "mobile"
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            Mobile
          </button>
        </div>
      </div>

      {/* Device mockup container */}
      <div className="mx-auto max-w-fit">
        {currentPreviewMode === "mobile" ? (
          /* Mobile Phone Mockup */
          <div className="mx-auto w-[350px]">
            <div className="relative overflow-hidden rounded-[36px] border-[14px] border-gray-900 bg-gray-900 shadow-xl">
              {/* Phone "notch" */}
              <div className="absolute left-1/2 top-0 z-10 h-6 w-40 -translate-x-1/2 rounded-b-lg bg-gray-900"></div>

              {/* Phone screen frame */}
              <div className="relative h-[650px] w-full overflow-hidden bg-white dark:bg-black">
                {/* Status bar */}
                <div className="sticky top-0 z-10 flex h-6 w-full items-center justify-between bg-gray-100 px-4 dark:bg-gray-800">
                  <div className="text-[10px] font-medium">9:41</div>
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-3 rounded-sm bg-gray-400"></div>
                    <div className="h-2 w-3 rounded-sm bg-gray-400"></div>
                    <div className="h-2 w-3 rounded-sm bg-gray-400"></div>
                  </div>
                </div>

                {/* Scrollable content area */}
                <div className="h-[644px] overflow-y-auto overflow-x-hidden bg-white dark:bg-black">
                  <div className="origin-top scale-[0.9] pb-12 pt-0">
                    {renderBlogContent()}
                  </div>
                </div>
              </div>

              {/* Home indicator */}
              <div className="absolute bottom-1 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-gray-300"></div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              Mobile Preview • Scroll to see more content{"\n"}
              Hover over and click on any section to edit its content.
            </div>
          </div>
        ) : (
          /* Desktop Browser Mockup */
          <div className="mx-auto max-w-[900px]">
            <div className="overflow-hidden rounded-lg border border-gray-300 shadow-lg">
              {/* Browser toolbar */}
              <div className="flex h-10 items-center space-x-1.5 bg-gray-200 px-3 dark:bg-gray-800">
                {/* Window controls */}
                <div className="flex space-x-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>

                {/* URL bar */}
                <div className="ml-4 flex h-6 flex-1 items-center rounded-md bg-white px-3 dark:bg-gray-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2 h-4 w-4 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                    />
                  </svg>
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    brilian-eka-saetama.com/#blogs
                  </span>
                </div>

                {/* Browser icons */}
                <div className="ml-4 flex space-x-2">
                  <div className="h-4 w-4 rounded-full bg-gray-400"></div>
                  <div className="h-4 w-4 rounded-full bg-gray-400"></div>
                </div>
              </div>

              {/* Browser content */}
              <div className="h-fit max-h-[600px] min-h-[250px] overflow-y-auto overflow-x-hidden bg-white dark:bg-black">
                <div className="origin-top scale-[0.85] pb-5">
                  {renderBlogContent()}
                </div>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              Desktop Preview • Scroll to see more content{"\n"}
              Hover over and click on any section to edit its content.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPreview;
