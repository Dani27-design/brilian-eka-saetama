import { getServerSideSitemap } from "next-sitemap";
import { getData } from "@/actions/read/hero";
import type { Blog } from "@/types/blog";
import { NextResponse } from 'next/server';

export async function GET() {
  let blogs: Blog[] = [];

  try {
    const blogData = await getData("id", "blog", "blogs");
    blogs = Array.isArray(blogData) ? blogData : [];
    console.log(`Fetched ${blogs.length} blogs for sitemap`); // Debug log
  } catch (error) {
    console.error("Error fetching blog data for sitemap:", error);
  }

  // Base URL of your site
  const baseUrl = "https://brilian-eka-saetama.vercel.app";
  
  // Start with static routes
  const fields = [
    {
      loc: baseUrl, // Root path
      lastmod: new Date().toISOString(),
      changefreq: "daily" as const,
      priority: 1.0,
    },
    {
      loc: `${baseUrl}/blog`, // Blog index page
      lastmod: new Date().toISOString(),
      changefreq: "daily" as const,
      priority: 0.9,
    }
  ];
  
  // Add blog post routes
  const blogFields = blogs
    .filter((blog) => blog.slug) // Only include blogs with slugs
    .map((blog) => ({
      loc: `${baseUrl}/blog/blog-details/${blog.slug}`,
      lastmod: blog.publishDate
        ? new Date(blog.publishDate).toISOString()
        : new Date().toISOString(),
      changefreq: "weekly" as const,
      priority: 0.7,
    }));
  
  // Combine all fields
  const allFields = [...fields, ...blogFields];

  // Generate the sitemap
  const sitemap = await getServerSideSitemap(allFields);
  
  // Add cache control headers to prevent caching
  sitemap.headers.set('Cache-Control', 'no-store, max-age=0');
  
  return sitemap;
}

// Set segment config to disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
