/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Static HTML export
  distDir: 'out',
  images: {
    unoptimized: true, // Required for static export
  },
}

module.exports = nextConfig