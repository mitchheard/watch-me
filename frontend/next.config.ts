import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // AVIDX-266: client `RecommendationsPage` mirrors server debug gating on Vercel preview.
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "",
  },
};

export default nextConfig;
