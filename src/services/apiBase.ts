import { resolveApiBaseUrl } from '@/src/config/apiBaseUrl';

/** Resolved API origin (includes `/api` prefix). Shared to avoid importing the full API module. */
export const API_BASE_URL = resolveApiBaseUrl();
