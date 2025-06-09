/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://brilian-eka-saetama.vercel.app",
  generateRobotsTxt: true,
  exclude: ["/admin/*", "/api/*"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    additionalSitemaps: [
      // If you have any additional sitemaps you can add them here
      "https://brilian-eka-saetama.vercel.app/server-sitemap.xml",
    ],
  },
  // Ensure Next.js builds all blog detail pages
  outDir: "./.next/sitemap",
  transform: async (config, path) => {
    // Custom priority and changefreq configurations
    // Default transformation for all other paths
    return {
      loc: path, // => this will be exported as http(s)://<config.siteUrl>/<path>
      changefreq: path.includes("/blog/blog-details/")
        ? "monthly"
        : path === "/blog"
        ? "weekly"
        : "daily",
      priority: path.includes("/blog/blog-details/")
        ? 0.7
        : path === "/blog"
        ? 0.8
        : 0.5,
      lastmod: new Date().toISOString(),
    };
  },
};
