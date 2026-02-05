import type { NextConfig } from "next";

const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5217/api').replace(/\/api$/, '')

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${backendBase}/uploads/:path*`,
      },
    ]
  },
};

export default nextConfig;
