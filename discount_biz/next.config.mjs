/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' - Vercel handles this automatically
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig;