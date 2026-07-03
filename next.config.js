/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  trailingSlash: true,

  async redirects() {
    return [
      // Example: Uncomment and customize for SEO redirects
      // { source: "/old-page/", destination: "/new-page/", permanent: true },
    ];
  },

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
