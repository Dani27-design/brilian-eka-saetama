// Import untuk Next.js App Router
import { MetadataRoute } from "next";
import { getData } from "@/actions/read/hero";
import type { Blog } from "@/types/blog";

// Handler untuk server-sitemap.xml
export async function GET(): Promise<Response> {
  // Get all blog posts
  const blogs = (await getData("id", "blog", "blogs")) as Blog[];

  // Generate blog post URLs
  const entries =
    blogs?.map((blog) => ({
      url: `https://brilian-eka-saetama.vercel.app/blog/blog-details/${blog.slug}`,
      lastModified: blog.publishDate ? new Date(blog.publishDate) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })) || [];

  // Ubah format ke XML sitemap yang benar
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `
  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified.toISOString()}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join("")}
</urlset>`;

  // Return dengan content-type yang benar
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

// Set revalidation period to update the sitemap regularly
export const revalidate = 3600; // revalidate every hour
