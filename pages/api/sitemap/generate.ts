// API route to generate sitemap XML and save to public/sitemaps/sitemap.xml
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { getData } from "@/actions/read/hero";
import type { Blog } from "@/types/blog";

const SITE_URL = "https://brilian-eka-saetama.vercel.app";

async function generateSitemapXml() {
  // Get all blog posts
  const blogs = (await getData("id", "blog", "blogs")) as Blog[];

  // Base URLs
  const urls = [
    {
      loc: SITE_URL,
      lastmod: new Date().toISOString(),
      changefreq: "monthly",
      priority: 1,
    },
    {
      loc: `${SITE_URL}/blog`,
      lastmod: new Date().toISOString(),
      changefreq: "weekly",
      priority: 0.8,
    },
  ];

  // Blog URLs
  if (blogs && Array.isArray(blogs)) {
    blogs.forEach((blog) => {
      urls.push({
        loc: `${SITE_URL}/blog/blog-details/${blog.slug}`,
        lastmod: blog.publishDate
          ? new Date(blog.publishDate).toISOString()
          : new Date().toISOString(),
        changefreq: "weekly",
        priority: 0.7,
      });
    });
  }

  // Build XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (url) =>
        `  <url>\n    <loc>${url.loc}</loc>\n    <lastmod>${url.lastmod}</lastmod>\n    <changefreq>${url.changefreq}</changefreq>\n    <priority>${url.priority}</priority>\n  </url>`,
    )
    .join("\n")}\n</urlset>`;
  return xml;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const xml = await generateSitemapXml();
    const dir = path.join(process.cwd(), "public", "sitemaps");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, "sitemap.xml");
    fs.writeFileSync(filePath, xml, "utf8");
    return res.status(200).json({
      success: true,
      message: "Sitemap generated",
      file: "/sitemaps/sitemap.xml",
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
