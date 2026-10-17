import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: ["@architecture-lab/content", "@architecture-lab/simulation-engine"],
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
};

export default nextConfig;
