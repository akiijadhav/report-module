/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ja'],
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      include: [path.join(__dirname, 'components'), path.join(__dirname, 'pages')],
      use: [defaultLoaders.babel],
    });
    return config;
  },
};

module.exports = nextConfig;
