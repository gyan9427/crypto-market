import Constants from 'expo-constants';
import appJson from '../../app.json';

export function getAppVersion(): string {
  return appJson.expo.version ?? Constants.expoConfig?.version ?? '1.0.0';
}

export function parseSemver(v: string): number[] {
  return v.split('.').map((n) => parseInt(n, 10) || 0);
}

export function isAppVersionBelowMin(minVersion: string): boolean {
  const current = parseSemver(getAppVersion());
  const min = parseSemver(minVersion);
  for (let i = 0; i < 3; i++) {
    if ((current[i] ?? 0) < (min[i] ?? 0)) return true;
    if ((current[i] ?? 0) > (min[i] ?? 0)) return false;
  }
  return false;
}
