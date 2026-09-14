import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const nextConfigDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ['192.168.1.2', '127.0.0.1', 'localhost'],
  turbopack: {
    root: nextConfigDir,
  },
};

export default nextConfig;
