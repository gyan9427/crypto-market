const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const passwordPolicyRoot = path.resolve(projectRoot, 'packages/nayft-password-policy');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [passwordPolicyRoot];

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    '@nayft/password-policy': passwordPolicyRoot,
  },
};

module.exports = config;
