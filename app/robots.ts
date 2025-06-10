// filepath: /app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/"],
      },
    ],
    sitemap: ["https://brilian-eka-saetama.vercel.app/sitemap.xml"],
    // Host directive dihapus karena tidak didukung oleh Google
  };
}
