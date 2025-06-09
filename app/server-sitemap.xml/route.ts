import { getServerSideSitemap, ISitemapField } from "next-sitemap";
import { getData } from "@/actions/read/hero";
import type { Blog } from "@/types/blog";

export async function GET(request: Request) {
  // Get all blog posts
  const blogs = (await getData("id", "blog", "blogs")) as Blog[];

  // Generate blog post URLs
  const blogEntries =
    blogs?.map((blog) => ({
      loc: `https://brilian-eka-saetama.vercel.app/blog/blog-details/${blog.slug}`,
      lastmod: blog.publishDate
        ? new Date(blog.publishDate).toISOString()
        : new Date().toISOString(),
      changefreq: "weekly" as const,
      priority: 0.7,
    })) || ([] as ISitemapField[]);

  // Return the sitemap
  return getServerSideSitemap(blogEntries);
}

// Set revalidation period to update the sitemap regularly
export const revalidate = 3600; // revalidate every hour
