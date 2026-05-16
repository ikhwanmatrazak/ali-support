import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ali-support.lightningcloud.my" },
    ],
  },
};

export default nextConfig;
