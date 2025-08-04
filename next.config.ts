import type {NextConfig} from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Aliasing to fix the 'ReactCurrentOwner' error with react-three-fiber
    // This ensures that all parts of the app use the same instance of React and Three.js
    Object.assign(config.resolve.alias, {
      react: path.resolve('./node_modules/react'),
      'three': path.resolve('./node_modules/three'),
    });
    return config;
  },
};

export default nextConfig;
