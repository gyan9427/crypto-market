import { Platform } from 'react-native';

export type ErrorSource = 'react' | 'promise' | 'global' | 'native';

export type IncidentReport = {
  id: string;
  source: ErrorSource;
  occurredAt: string;
  headlineIndex: number;
  /** Safe for users in production; full detail only in development. */
  publicSummary: string;
  /** Full message — development only. */
  technicalMessage: string;
  componentTrace?: string;
};

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function createIncidentId(error: Error, source: ErrorSource): string {
  const digest = hashSeed(`${error.name}:${error.message}:${source}`).toString(16).padStart(6, '0');
  const stamp = Date.now().toString(36).slice(-4).toUpperCase();
  return `NAY-${stamp}-${digest.slice(0, 6).toUpperCase()}`;
}

export function pickHeadlineIndex(incidentId: string, headlineCount: number): number {
  if (headlineCount <= 0) return 0;
  return hashSeed(incidentId) % headlineCount;
}

export function sanitizePublicSummary(_error: Error): string {
  return 'An internal exception was intercepted before it could reach the interface.';
}

export function buildIncidentReport(
  error: Error,
  source: ErrorSource,
  componentTrace?: string,
  headlineCount = 6
): IncidentReport {
  const id = createIncidentId(error, source);
  return {
    id,
    source,
    occurredAt: new Date().toISOString(),
    headlineIndex: pickHeadlineIndex(id, headlineCount),
    publicSummary: sanitizePublicSummary(error),
    technicalMessage: error.message || 'Unknown error',
    componentTrace,
  };
}

export function formatIncidentClipboard(report: IncidentReport): string {
  const platform = Platform.OS;
  return [
    'NAYFT Incident Reference',
    `ID: ${report.id}`,
    `Source: ${report.source}`,
    `Platform: ${platform}`,
    `Time: ${report.occurredAt}`,
  ].join('\n');
}
