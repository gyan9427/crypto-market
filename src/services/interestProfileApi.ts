import { apiRequest } from '@/src/services/api';

export type InterestProfileSignalsPayload = {
  readArticleIds?: string[];
  savedArticleIds?: string[];
  searchedSymbols?: string[];
  dwellTimeBuckets?: Record<string, number>;
};

export async function syncInterestProfileSignals(
  payload: InterestProfileSignalsPayload
): Promise<boolean> {
  try {
    await apiRequest<{ accepted: boolean }>('/interest-profile/signals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return true;
  } catch {
    return false;
  }
}
