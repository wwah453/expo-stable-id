const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

config.resolver.blockList = [
  new RegExp(path.resolve(monorepoRoot, 'node_modules', 'react', '.*').replace(/\\/g, '\\\\')),
  new RegExp(path.resolve(monorepoRoot, 'node_modules', 'react-native', '.*').replace(/\\/g, '\\\\')),
];

config.resolver.extraNodeModules = {
  '@nauverse/expo-stable-id': monorepoRoot,
};

module.exports = config;
