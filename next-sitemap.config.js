/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://brilian-eka-saetama.vercel.app",
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  exclude: ["/admin/*", "/api/*"],
  additionalPaths: async (config) => [
    {
      loc: "/",
      changefreq: "daily",
      priority: 1.0,
      lastmod: new Date().toISOString(),
    },
    {
      loc: "/server-sitemap-index.xml",
      lastmod: new Date().toISOString(),
      priority: 0.7,
    },
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    additionalSitemaps: [
      "https://brilian-eka-saetama.vercel.app/server-sitemap-index.xml",
      "https://brilian-eka-saetama.vercel.app/sitemap.xml",
    ],
  },
  transform: async (config, path) => {
    // Set higher priority for homepage
    let priority = config.priority;
    if (path === "/") {
      priority = 1.0;
    }

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    };
  },
};
