const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withExpoImage(config) {
  return withAndroidManifest(config, (config) => {
    return config;
  });
};
