import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  generateBuildId: async () => 'church-os-build',
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
