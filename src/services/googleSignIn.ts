import { Platform, TurboModuleRegistry } from 'react-native';

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

let cachedModule: GoogleSignInModule | null | undefined;

export function isGoogleSignInAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    return TurboModuleRegistry.get('RNGoogleSignin') != null;
  } catch {
    return false;
  }
}

function loadGoogleSignInModule(): GoogleSignInModule | null {
  if (cachedModule !== undefined) return cachedModule;
  if (!isGoogleSignInAvailable()) {
    cachedModule = null;
    return null;
  }
  try {
    cachedModule = require('@react-native-google-signin/google-signin') as GoogleSignInModule;
    return cachedModule;
  } catch {
    cachedModule = null;
    return null;
  }
}

export function configureGoogleSignIn(options: {
  webClientId?: string;
  offlineAccess?: boolean;
}): void {
  const mod = loadGoogleSignInModule();
  if (!mod) return;
  mod.GoogleSignin.configure(options);
}

export async function signInWithGoogleNative(): Promise<string | null> {
  const mod = loadGoogleSignInModule();
  if (!mod) {
    throw new Error('Google Sign-In requires a development or production build');
  }
  await mod.GoogleSignin.hasPlayServices();
  const userInfo = await mod.GoogleSignin.signIn();
  return userInfo.data?.idToken ?? null;
}

export function isGoogleSignInCancelledError(err: unknown): boolean {
  const mod = loadGoogleSignInModule();
  const code = (err as { code?: string })?.code;
  if (mod && code === mod.statusCodes.SIGN_IN_CANCELLED) return true;
  return code === '12501';
}

export function isGoogleSignInInProgressError(err: unknown): boolean {
  const mod = loadGoogleSignInModule();
  const code = (err as { code?: string })?.code;
  if (mod && code === mod.statusCodes.IN_PROGRESS) return true;
  return code === 'ASYNC_OP_IN_PROGRESS';
}

export function isPlayServicesUnavailableError(err: unknown): boolean {
  const mod = loadGoogleSignInModule();
  const code = (err as { code?: string })?.code;
  if (mod && code === mod.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) return true;
  return code === 'PLAY_SERVICES_NOT_AVAILABLE';
}
