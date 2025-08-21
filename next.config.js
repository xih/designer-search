/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Enable WASM loading for ONNX Runtime
  serverExternalPackages: ['onnxruntime-web'],
  webpack: (config, { isServer }) => {
    // Enable WASM loading for client-side
    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };
      config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm';
    }
    return config;
  },
  images: {
    // Allow external images from common profile photo sources
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allow all HTTPS domains for profile images
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
    // Common profile image sources including Firebase Storage
    domains: [
      "images.unsplash.com",
      "avatars.githubusercontent.com",
      "pbs.twimg.com",
      "media.licdn.com",
      "lh3.googleusercontent.com",
      "gravatar.com",
      "www.gravatar.com",
      "images.ctfassets.net",
      "res.cloudinary.com",
      "s3.amazonaws.com",
      "images.squarespace-cdn.com",
      "cdn.dribbble.com",
      "mir-s3-cdn-cf.behance.net",
      "firebasestorage.googleapis.com", // Firebase Storage for your profile photos
      "ui-avatars.com", // Placeholder avatar service
      "avatars.dicebear.com", // Avatar generation service
      "robohash.org", // Robot avatar service
    ],
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/flags",
        destination: "https://us.i.posthog.com/flags",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default config;
