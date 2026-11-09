// @ts-check

// Contentlayer runs as its own process (see the `dev` and `build` scripts) rather than
// through next-contentlayer2's `withContentlayer`, whose webpack plugin is incompatible
// with Turbopack, the default bundler since Next.js 16.

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    "contentlayer2",
    "@contentlayer2/client",
    "@contentlayer2/core",
    "@contentlayer2/source-files",
  ],
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

module.exports = nextConfig;
