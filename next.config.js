/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'image.pollinations.ai'
      }
    ]
  },
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false
  }
};

module.exports = nextConfig;

