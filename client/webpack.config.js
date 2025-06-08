const path = require('path');
const webpack = require('webpack');

module.exports = {
  // ... other config ...
  resolve: {
    fallback: {
      "path": require.resolve("path-browserify"),
      "fs": false,
      "url": require.resolve("url/"),
      "buffer": require.resolve("buffer/"),
      "stream": require.resolve("stream-browserify"),
      "util": require.resolve("util/")
    }
  },
  module: {
    rules: [
      // ... other rules ...
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ],
      },
    ],
  },
  plugins: [
    // ... other plugins ...
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ]
};
