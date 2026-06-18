import { useAuthStore } from '../state/useAuthStore';
import { API_BASE_URL } from '../services/api';
import { canTrackAnalytics } from '../privacy/consentStore';

export interface TrackEventPayload {
  featureKey: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}

export function trackArticleOpened(newsId: string): void {
  trackEvent({ featureKey: 'news_feed', eventType: 'article_opened', metadata: { newsId } });
}

export function trackSourceViewed(
  newsId: string,
  sourceKey: string,
  surface: 'card' | 'featured' | 'detail' | 'search'
): void {
  if (!sourceKey) return;
  trackEvent({ featureKey: 'news_feed', eventType: 'source_viewed', metadata: { newsId, sourceKey, surface } });
}

export function trackSourceClicked(
  newsId: string,
  sourceKey: string,
  surface: 'card' | 'detail',
  destination: 'source_url' | 'in_app_browser' = 'in_app_browser'
): void {
  if (!sourceKey) return;
  trackEvent({ featureKey: 'news_feed', eventType: 'source_clicked', metadata: { newsId, sourceKey, surface, destination } });
}

export function trackSourceShared(
  newsId: string,
  sourceKey: string,
  shareChannel?: 'native_sheet' | 'clipboard' | 'web_share'
): void {
  if (!sourceKey) return;
  trackEvent({ featureKey: 'news_feed', eventType: 'source_shared', metadata: { newsId, sourceKey, ...(shareChannel ? { shareChannel } : {}) } });
}

export function trackAuthEvent(
  eventType:
    | 'login_attempt'
    | 'google_login_attempt'
    | 'navigate_to_register'
    | 'weak_password_attempt',
  metadata: Record<string, unknown> = {}
): void {
  trackEvent({ featureKey: 'auth', eventType, metadata });
}

/**
 * Track an event. Fire-and-forget; gated by privacy consent.
 */
export function trackEvent(payload: TrackEventPayload): void {
  if (!canTrackAnalytics()) return;

  const { featureKey, eventType, metadata = {} } = payload;
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ featureKey, eventType, metadata }),
  }).catch(() => {});
}
