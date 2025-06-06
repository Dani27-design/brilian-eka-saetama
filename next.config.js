/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  images: {
    domains: ["localhost", "firebasestorage.googleapis.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: "",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix for the undici issue
    config.module.rules.push({
      test: /\.m?js$/,
      type: "javascript/auto",
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
  transpilePackages: ["@firebase/auth", "firebase", "undici"],
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "framer-motion",
      "react-icons",
      "firebase/firestore",
      "react-query",
    ],
  },
  output: "standalone",
};

module.exports = nextConfig;
