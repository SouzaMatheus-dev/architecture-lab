import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@architecture-lab/content", "@architecture-lab/simulation-engine"],
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
};

export default nextConfig;
