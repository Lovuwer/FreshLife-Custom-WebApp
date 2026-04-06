import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "erp.freshlife.app",
      },
    ],
  },
};

export default nextConfig;
