import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ['app', 'components', 'lib', 'utils', 'types'],
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: './tsconfig.json',
  },
  experimental: {
    useCache: true,
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
  output: 'standalone',
};

export default nextConfig;
