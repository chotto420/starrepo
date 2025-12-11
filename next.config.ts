import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ビルド時にESLintエラーを無視
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ビルド時にTypeScriptエラーを無視
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.rbxcdn.com",
      },
      {
        protocol: "https",
        hostname: "**.roblox.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "dm2302files.roblox.com",
      }
    ],
  },
};

export default nextConfig;
