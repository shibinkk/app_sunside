const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = true;
// This helps with some firebase resolution issues
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
};

module.exports = config;
