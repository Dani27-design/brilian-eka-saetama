// filepath: /app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: [
      "https://brilian-eka-saetama.vercel.app/sitemap.xml",
      "https://brilian-eka-saetama.vercel.app/server-sitemap.xml",
    ],
    host: "https://brilian-eka-saetama.vercel.app",
  };
}
