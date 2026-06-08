import { normalizeError } from './normalizeError';
import type { ErrorSource } from './incidentReport';

export type GlobalErrorListener = (error: Error, source: ErrorSource) => void;

let listener: GlobalErrorListener | null = null;
const pending: Array<{ error: Error; source: ErrorSource }> = [];

export function setGlobalErrorListener(next: GlobalErrorListener | null): void {
  listener = next;
  if (!next) return;
  while (pending.length > 0) {
    const item = pending.shift();
    if (item) next(item.error, item.source);
  }
}

export function notifyGlobalError(value: unknown, source: ErrorSource): void {
  const error = normalizeError(value);
  if (listener) {
    listener(error, source);
    return;
  }
  pending.push({ error, source });
}
