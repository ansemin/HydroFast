const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add 'stl' to the list of asset extensions
config.resolver.assetExts.push('stl');

module.exports = config; 