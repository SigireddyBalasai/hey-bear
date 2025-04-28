import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "image/x-icon",
          },
        ],
      },
    ];
  },
  // Ensure static assets are handled correctly
  output: 'standalone',
};

export default nextConfig;
