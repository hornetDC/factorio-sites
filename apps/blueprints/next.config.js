/* eslint-disable @typescript-eslint/no-var-requires */

// To be included in dependencies, chakra-ui depends on it but has it as peer dependency
require("framer-motion");

module.exports = {
  poweredByHeader: false,
  reactStrictMode: true,
  assetPrefix: process.env.ASSET_PREFIX ? process.env.ASSET_PREFIX : "",
  publicRuntimeConfig: {
    PUBLIC_URL: process.env.PUBLIC_URL || "",
  },
  webpack(config, options) {
    const { dev, isServer } = options;

    // Do not run type checking twice
    if (dev && isServer) {
      const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
      config.plugins.push(new ForkTsCheckerWebpackPlugin());
    }

    return config;
  },
};
