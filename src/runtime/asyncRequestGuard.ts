type ScopeState = {
  generation: number;
  controller: AbortController | null;
};

const scopes = new Map<string, ScopeState>();

function getScope(scope: string): ScopeState {
  let s = scopes.get(scope);
  if (!s) {
    s = { generation: 0, controller: null };
    scopes.set(scope, s);
  }
  return s;
}

export function bumpGeneration(scope: string): void {
  const s = getScope(scope);
  s.generation += 1;
  s.controller?.abort();
  s.controller = null;
}

export function createRequestGuard(scope: string): {
  generation: number;
  signal: AbortSignal;
  isStale: () => boolean;
} {
  const s = getScope(scope);
  s.controller?.abort();
  s.controller = new AbortController();
  const gen = s.generation;
  return {
    generation: gen,
    signal: s.controller.signal,
    isStale: () => s.generation !== gen,
  };
}

export async function withLatestWins<T>(
  scope: string,
  fn: (signal: AbortSignal) => Promise<T>
): Promise<T | undefined> {
  const guard = createRequestGuard(scope);
  try {
    const result = await fn(guard.signal);
    if (guard.isStale()) return undefined;
    return result;
  } catch (err) {
    if (guard.signal.aborted) return undefined;
    throw err;
  }
}

const DEFAULT_FETCH_TIMEOUT_MS = 8_000;

/** Fetch with timeout — uses caller signal when provided, otherwise applies timeout abort. */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = DEFAULT_FETCH_TIMEOUT_MS, signal, ...rest } = init;
  if (signal) {
    return fetch(input, { ...rest, signal });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
