import createJiti from "jiti";
import { fileURLToPath } from "node:url";
const jiti = createJiti(fileURLToPath(import.meta.url));

// Import env here to validate during build. Using jiti@^1 we can import .ts files :)
jiti("./lib/env");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://eu.i.posthog.com/decide",
      },
    ];
  },
  webpack: (config) => {
    // Exclude LICENSE files and other non-JavaScript files from being processed
    config.module.rules.push({
      test: /\.(md|txt|license)$/i,
      type: "asset/resource",
    });

    // Ignore LICENSE files in node_modules
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /Failed to parse source map/,
    ];

    // Fix HeartbeatWorker.js ES module issue while keeping minification
    config.module.rules.unshift({
      test: /HeartbeatWorker\.js$/,
      type: "asset/source",
    });

    // Configure Terser to handle ES modules and exclude HeartbeatWorker.js
    if (config.optimization && config.optimization.minimizer) {
      config.optimization.minimizer.forEach((plugin) => {
        if (plugin.constructor.name === "TerserPlugin") {
          plugin.options = plugin.options || {};
          plugin.options.exclude = /HeartbeatWorker\.js$/;
          plugin.options.terserOptions = {
            ...plugin.options.terserOptions,
            module: true,
            ecma: 2020,
          };
        }
      });
    }

    return config;
  },
};

export default nextConfig;
