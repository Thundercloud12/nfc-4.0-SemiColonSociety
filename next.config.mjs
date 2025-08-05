/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
    unoptimized: true,
  },
  i18n: {
    locales: ['en', 'hi'],
    defaultLocale: 'en',
    localeDetection: false, // Disable auto-detection to let users choose manually
  },
};

export default nextConfig;
