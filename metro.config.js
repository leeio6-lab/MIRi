const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Fix import.meta for web bundling
config.resolver.unstable_enablePackageExports = false;

// Web: replace native-only modules with web stubs
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // react-native-iap → empty module on web
    if (moduleName === 'react-native-iap' || moduleName === 'react-native-nitro-modules') {
      return { type: 'empty' };
    }
    // Use iap.web.ts instead of iap.ts on web
    if (moduleName.endsWith('/iap') || moduleName.endsWith('/iap.ts')) {
      return context.resolveRequest(context, moduleName.replace(/\/iap(\.ts)?$/, '/iap.web'), platform);
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
