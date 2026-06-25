/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@smart-erp/i18n',
    '@smart-erp/types',
    '@smart-erp/validation',
    '@smart-erp/hooks',
    '@smart-erp/utils',
    '@smart-erp/sync',
    '@smart-erp/ui',
  ],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { remotePatterns: [] },
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  rewrites: process.env.NODE_ENV === 'development' ? async () => [
    { source: '/api/:path*', destination: 'http://localhost:3456/api/:path*' },
    { source: '/socket.io/:path*', destination: 'http://localhost:3456/socket.io/:path*' },
  ] : undefined,
};

export default nextConfig;

