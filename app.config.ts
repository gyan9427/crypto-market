import type { ConfigContext, ExpoConfig } from 'expo/config';

import appJson from './app.json';

export default ({ config }: ConfigContext): ExpoConfig => {
  const base = (appJson as { expo: ExpoConfig }).expo;

  return {
    ...config,
    ...base,
    name: process.env.APP_DISPLAY_NAME ?? base.name,
    version: base.version,
    android: {
      ...base.android,
      package: base.android?.package ?? 'com.nayft.app',
    },
    ios: {
      ...base.ios,
      bundleIdentifier: base.ios?.bundleIdentifier ?? 'com.nayft.app',
    },
    extra: {
      ...base.extra,
      environment: process.env.EAS_BUILD_PROFILE ?? process.env.NODE_ENV ?? 'development',
      gitSha:
        process.env.EAS_BUILD_GIT_COMMIT_HASH ??
        process.env.GITHUB_SHA ??
        'dev',
      easBuildId: process.env.EAS_BUILD_ID ?? null,
      buildProfile: process.env.EAS_BUILD_PROFILE ?? 'local',
    },
  };
};
