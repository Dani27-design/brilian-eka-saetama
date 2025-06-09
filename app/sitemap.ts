// filepath: /app/sitemap.ts
import { MetadataRoute } from "next";
import { getData } from "@/actions/read/hero";
import type { Blog } from "@/types/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get all blog posts
  const blogs = (await getData("id", "blog", "blogs")) as Blog[];

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
  const blogUrls =
    blogs?.map((blog) => ({
      url: `https://brilian-eka-saetama.vercel.app/blog/blog-details/${blog.slug}`,
      lastModified: blog.publishDate ? new Date(blog.publishDate) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })) || [];

  return [...baseUrls, ...blogUrls];
}

export const revalidate = 3600; // Revalidate every hour
