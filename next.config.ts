import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xuodsnxfipfetlkwbcjz.supabase.co',
        pathname: '/storage/**',
      },
    ],
  },
};

export default nextConfig;
