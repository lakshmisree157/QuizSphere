const path = require('path');

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
  plugins: [
    // ... other plugins ...
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ]
}; 