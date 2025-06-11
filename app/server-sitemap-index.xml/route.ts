import { getServerSideSitemap } from "next-sitemap";
import { getData } from "@/actions/read/hero";
import type { Blog } from "@/types/blog";

export async function GET() {
  let blogs: Blog[] = [];

  try {
    const blogData = await getData("id", "blog", "blogs");
    blogs = Array.isArray(blogData) ? blogData : [];
  } catch (error) {
    console.error("Error fetching blog data for sitemap:", error);
  }

  const fields = blogs
    .filter((blog) => blog.slug) // Only include blogs with slugs
    .map((blog) => ({
      loc: `https://brilian-eka-saetama.vercel.app/blog/blog-details/${blog.slug}`,
      lastmod: blog.publishDate
        ? new Date(blog.publishDate).toISOString()
        : new Date().toISOString(),
      changefreq: "weekly" as const,
      priority: 0.7,
    }));

  return getServerSideSitemap(fields);
}
