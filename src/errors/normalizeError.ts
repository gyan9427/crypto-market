export function normalizeError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  if (
    value &&
    typeof value === 'object' &&
    'message' in value &&
    typeof (value as { message: unknown }).message === 'string'
  ) {
    return new Error((value as { message: string }).message);
  }
  return new Error('An unexpected failure occurred.');
}
