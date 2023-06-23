/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  i18n: {
    locales: ['en', 'ja'], // Your supported locales
    defaultLocale: 'en', // The default locale
  },
};

module.exports = nextConfig;
