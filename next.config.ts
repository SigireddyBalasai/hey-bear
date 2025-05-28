import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: false,
  openAnalyzer: false,
});

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  eslint: {
    // Run ESLint on these directories during production builds
    dirs: ['app', 'components', 'lib', 'utils', 'types'],
    // Don't fail the build for linting errors in development
    ignoreDuringBuilds: false,
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
  // Ensure static assets are handled correctly
  output: 'standalone',
};

export default withBundleAnalyzer(nextConfig);
