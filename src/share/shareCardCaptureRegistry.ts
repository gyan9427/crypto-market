import type { ShareableNews } from '@/src/utils/share';

type CaptureFn = (item: ShareableNews) => Promise<string | null>;

let captureFn: CaptureFn | null = null;

export function registerShareCardCapture(fn: CaptureFn | null): void {
  captureFn = fn;
}

export async function captureShareCardImage(item: ShareableNews): Promise<string | null> {
  if (!captureFn) return null;
  return captureFn(item);
}
