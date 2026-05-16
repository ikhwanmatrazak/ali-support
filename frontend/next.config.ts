import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Don't fail the build on ESLint warnings
  eslint: { ignoreDuringBuilds: true },
  // Don't fail the build on TypeScript errors (they're caught in dev)
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ali-support.lightningcloud.my" },
    ],
  },
};

export default nextConfig;
