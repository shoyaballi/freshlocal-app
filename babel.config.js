module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': '.',
          },
        },
      ],
      // Transform import.meta.env (used by zustand v5) to process.env for web compatibility
      importMetaTransform,
      'react-native-reanimated/plugin',
    ],
  };
};

// Inline Babel plugin: replaces import.meta.env.MODE with process.env.NODE_ENV
// and import.meta.env with { MODE: process.env.NODE_ENV }
function importMetaTransform() {
  return {
    visitor: {
      MetaProperty(path) {
        // import.meta.env.MODE → process.env.NODE_ENV
        if (
          path.parentPath.isMemberExpression() &&
          path.parentPath.get('property').isIdentifier({ name: 'env' })
        ) {
          const grandParent = path.parentPath.parentPath;
          if (
            grandParent.isMemberExpression() &&
            grandParent.get('property').isIdentifier({ name: 'MODE' })
          ) {
            grandParent.replaceWithSourceString('process.env.NODE_ENV');
            return;
          }
          // import.meta.env → { MODE: process.env.NODE_ENV }
          path.parentPath.replaceWithSourceString(
            '({ MODE: process.env.NODE_ENV })'
          );
          return;
        }
        // import.meta → { env: { MODE: process.env.NODE_ENV }, url: "" }
        path.replaceWithSourceString(
          '({ env: { MODE: process.env.NODE_ENV }, url: "" })'
        );
      },
    },
  };
}
