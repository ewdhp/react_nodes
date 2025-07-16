module.exports = function override(config, env) {
  // Disable source map warnings for node_modules
  config.module.rules.push({
    test: /\.js$/,
    enforce: 'pre',
    use: ['source-map-loader'],
    exclude: [
      /node_modules\/@mediapipe/,
      /node_modules\/three/,
      /node_modules\/@react-three/
    ]
  });

  return config;
};
