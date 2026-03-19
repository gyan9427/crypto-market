import { useAuthStore } from '../state/useAuthStore';
import { API_BASE_URL } from '../services/api';

export interface TrackEventPayload {
  featureKey: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}

/**
 * Track an event. Fire-and-forget; does not block or throw.
 * Use for button clicks, navigation, key actions.
 */
export function trackEvent(payload: TrackEventPayload): void {
  const { featureKey, eventType, metadata = {} } = payload;
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ featureKey, eventType, metadata }),
  }).catch(() => {});
}
