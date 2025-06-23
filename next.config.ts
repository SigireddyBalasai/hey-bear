import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    dirs: ['app', 'components','utils','lib']
  },
  /* other config options here */
};

export default nextConfig;
