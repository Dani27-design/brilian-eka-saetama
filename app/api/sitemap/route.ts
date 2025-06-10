// app/api/sitemap/route.ts
import { NextResponse } from "next/server";
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

  const urls = [
    "https://brilian-eka-saetama.vercel.app/",
    "https://brilian-eka-saetama.vercel.app/blog",
    ...blogs.map(
      (blog) =>
        `https://brilian-eka-saetama.vercel.app/blog/blog-details/${blog.slug}`,
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`,
  )
  .join("")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
