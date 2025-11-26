/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['cdn.kupuri.studio', 'ipfs.io', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.kupuri.studio',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_POLYGON_RPC: process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://polygon-rpc.com',
    NEXT_PUBLIC_NFT_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS,
    NEXT_PUBLIC_MAGIC_LINK_API_KEY: process.env.NEXT_PUBLIC_MAGIC_LINK_API_KEY,
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
  typescript: {
    tsconfigPath: '../tsconfig.base.json',
  },
};

module.exports = nextConfig;
