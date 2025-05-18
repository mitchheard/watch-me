/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Added for Google user avatars if needed later
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Add other existing Next.js configurations here if you have them
  // For example:
  // reactStrictMode: true,
  // experimental: {
  //   appDir: true,
  // },
};

module.exports = nextConfig; 