// @ts-check

const { withContentlayer } = require("next-contentlayer2");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [
      "contentlayer2",
      "@contentlayer2/client",
      "@contentlayer2/core",
      "@contentlayer2/source-files",
    ],
  },
  rewrites: async () => [
    {
      source: "/posts/test",
      destination: "/posts/get-started",
    },
  ],
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "cv.martondobos.com",
          },
        ],
        destination: "https://www.notion.so/Marton-Dobos-2a419cd7d9238095932ec81bcd225236",
        permanent: true,
      },
    ];
  },
};

module.exports = withContentlayer(nextConfig);
