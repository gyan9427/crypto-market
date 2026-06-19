export interface RuntimeHints {
  minAppVersion: string;
  wsProtocolV2Required: boolean;
  eventsSchemaEnforcement: string;
}

let cachedHints: RuntimeHints | null = null;
let cachedAt = 0;

export function getRuntimeHintsCached(): RuntimeHints | null {
  return cachedHints;
}

export function getRuntimeHintsCachedAt(): number {
  return cachedAt;
}

export function setRuntimeHintsCache(hints: RuntimeHints): void {
  cachedHints = hints;
  cachedAt = Date.now();
}

export function clearRuntimeHintsCache(): void {
  cachedHints = null;
  cachedAt = 0;
}
