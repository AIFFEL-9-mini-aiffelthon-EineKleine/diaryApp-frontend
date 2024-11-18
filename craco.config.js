// craco.config.js
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Provide fallback for Node.js modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        path: require.resolve('path-browserify'),
        stream: require.resolve('stream-browserify'),
        fs: false, // 'fs' is not available in the browser
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser'),
      };
      
      // Add ProvidePlugin to inject process and Buffer
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        }),
      ];
      
      return webpackConfig;
    },
  },
};