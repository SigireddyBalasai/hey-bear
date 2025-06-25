import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  eslint: {
    dirs: ["app", "components", "utils", "lib"],
  },
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
};

export default nextConfig;
