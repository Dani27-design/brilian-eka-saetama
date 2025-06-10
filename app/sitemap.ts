// filepath: /app/sitemap.ts
import { MetadataRoute } from "next";
import { getData } from "@/actions/read/hero";
import type { Blog } from "@/types/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Get all blog posts with error handling
    let blogs: Blog[] = [];
    try {
      const blogData = await getData("id", "blog", "blogs");
      blogs = Array.isArray(blogData) ? blogData : [];
      console.log(`Sitemap: Found ${blogs.length} blog posts`);
    } catch (error) {
      console.error("Error fetching blog data for sitemap:", error);
      // Continue with empty blogs array if fetch fails
    }

    // Base URLs
    const baseUrls = [
      {
        url: "https://brilian-eka-saetama.vercel.app",
        lastModified: new Date(),
        changeFrequency: "yearly" as const,
        priority: 1,
      },
      {
        url: "https://brilian-eka-saetama.vercel.app/blog",
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
    ];

    // Generate blog post URLs
    const blogUrls = blogs
      .filter((blog) => blog.slug) // Ensure blog has a slug
      .map((blog) => ({
        url: `https://brilian-eka-saetama.vercel.app/blog/blog-details/${blog.slug}`,
        lastModified: blog.publishDate
          ? new Date(blog.publishDate)
          : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));

    console.log(`Sitemap: Generated ${blogUrls.length} blog URLs`);
    return [...baseUrls, ...blogUrls];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return basic sitemap if there's an error
    return [
      {
        url: "https://brilian-eka-saetama.vercel.app",
        lastModified: new Date(),
        changeFrequency: "yearly" as const,
        priority: 1,
      },
    ];
  }
}

export const revalidate = 3600; // Revalidate every hour
