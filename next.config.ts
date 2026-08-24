import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["formidable", "fs-extra"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    }
  }
};

export default nextConfig;
