import Constants from 'expo-constants';

import { getAppVersion } from '@/src/config/appVersion';

export interface BuildInfo {
  version: string;
  versionCode: number | null;
  gitSha: string;
  easBuildId: string | null;
  buildProfile: string;
  environment: string;
}

export function getBuildInfo(): BuildInfo {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const android = Constants.expoConfig?.android;

  return {
    version: getAppVersion(),
    versionCode: android?.versionCode ?? null,
    gitSha: typeof extra?.gitSha === 'string' ? extra.gitSha : 'dev',
    easBuildId: typeof extra?.easBuildId === 'string' ? extra.easBuildId : null,
    buildProfile: typeof extra?.buildProfile === 'string' ? extra.buildProfile : 'local',
    environment: typeof extra?.environment === 'string' ? extra.environment : 'development',
  };
}

export function formatBuildInfoLine(): string {
  const info = getBuildInfo();
  const parts = [
    `v${info.version}`,
    info.versionCode != null ? `(${info.versionCode})` : null,
    info.gitSha !== 'dev' ? info.gitSha.slice(0, 7) : null,
    info.buildProfile !== 'local' ? info.buildProfile : null,
  ].filter(Boolean);
  return parts.join(' · ');
}
