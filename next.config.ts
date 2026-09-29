import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/", destination: "/home" }];
  },
};

export default nextConfig;
