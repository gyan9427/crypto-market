import { Platform } from 'react-native';
import { notifyGlobalError } from './errorBoundaryBridge';

let installed = false;
let previousNativeHandler: ((error: Error, isFatal?: boolean) => void) | undefined;

function installWebHandlers(): void {
  if (typeof globalThis === 'undefined') return;
  const g = globalThis as typeof globalThis & {
    addEventListener?: (type: string, listener: (event: Event) => void) => void;
  };
  if (!g.addEventListener) return;

  g.addEventListener('error', (event: Event) => {
    const errEvent = event as ErrorEvent;
    notifyGlobalError(errEvent.error ?? errEvent.message, 'global');
  });

  g.addEventListener('unhandledrejection', (event: Event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    notifyGlobalError(reason, 'promise');
  });
}

function installNativeHandler(): void {
  try {
    const { ErrorUtils } = require('react-native') as {
      ErrorUtils?: {
        getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void;
        setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
      };
    };
    if (!ErrorUtils?.setGlobalHandler) return;

    previousNativeHandler = ErrorUtils.getGlobalHandler?.();
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      notifyGlobalError(error, 'native');
      previousNativeHandler?.(error, isFatal);
    });
  } catch {
    // Hermes / web may not expose ErrorUtils the same way.
  }
}

export function installGlobalErrorHandlers(): void {
  if (installed) return;
  installed = true;

  if (Platform.OS === 'web') {
    installWebHandlers();
  } else {
    installNativeHandler();
  }
}
