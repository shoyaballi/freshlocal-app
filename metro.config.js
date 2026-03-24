const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix import.meta usage (from zustand) on web — transform it to process.env equivalent
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

// Resolve .web.ts/.web.tsx files before .ts/.tsx on web
config.resolver = {
  ...config.resolver,
  resolverMainFields: ['react-native', 'browser', 'main'],
};

module.exports = config;
