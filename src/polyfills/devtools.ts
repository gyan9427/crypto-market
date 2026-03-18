/**
 * Polyfill for React DevTools "Invalid argument not valid semver" error.
 * The Chrome extension can throw when it receives an empty version string.
 * This runs before React and patches the global hook to sanitize versions.
 */
if (typeof window !== 'undefined') {
  const isInvalidVersion = (value: unknown) =>
    value == null || value === '' || (typeof value === 'string' && !/^\d+\.\d+\.\d+/.test(value));

  const sanitizeVersion = (value: unknown) => (isInvalidVersion(value) ? '0.0.0' : value);

  const sanitizePayload = (value: unknown): unknown => {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map((entry) => sanitizePayload(entry));

    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(obj)) {
      if (key === 'version') {
        out[key] = sanitizeVersion(raw);
      } else {
        out[key] = sanitizePayload(raw);
      }
    }
    return out;
  };

  const install = () => {
    const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook || hook.__semverPatched) return;

    const renderers = hook.renderers;
    if (renderers && typeof renderers.set === 'function') {
      const originalSet = renderers.set.bind(renderers);
      renderers.set = (id: unknown, renderer: Record<string, unknown>) => {
        if (renderer && typeof renderer === 'object') {
          renderer = sanitizePayload(renderer) as Record<string, unknown>;
        }
        return originalSet(id, renderer);
      };
    }

    if (typeof hook.emit === 'function') {
      const originalEmit = hook.emit.bind(hook);
      hook.emit = (ev: string, arg: unknown) => {
        const sanitizedArg = sanitizePayload(arg);
        try {
          return originalEmit(ev, sanitizedArg);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          // Prevent the DevTools extension from crashing the app on invalid semver payloads.
          if (message.includes('not valid semver')) {
            return undefined;
          }
          throw error;
        }
      };
    }

    (hook as any).__semverPatched = true;
  };

  if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    install();
  } else {
    const observer = new MutationObserver(() => {
      if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        install();
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(install, 0);
  }
}
