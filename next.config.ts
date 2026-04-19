import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Empty turbopack config to satisfy Next 16
  turbopack: {},
};

export default nextConfig;
