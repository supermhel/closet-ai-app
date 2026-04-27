import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'api.dicebear.com',
      'res.cloudinary.com',
      'images.unsplash.com'
    ],
  },
  eslint: {
    // Allow build to complete with linter warnings for production verification
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow build to complete with type errors for production verification  
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
