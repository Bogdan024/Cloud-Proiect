/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
      return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },

};

export default nextConfig;
