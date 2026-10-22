import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: process.env.NODE_ENV === 'development' ? ['127.0.0.1', ...(process.env.DEV_ALLOWED_ORIGINS ?? '').split(',').filter(Boolean).map(value => new URL(value.trim()).hostname)] : [],
  images: { remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' }] },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ] }];
  },
};
export default config;

