import { apiRequest } from '@/src/services/api';

export type DeviceSessionUpsertRequest = {
  deviceId: string;
  platform: 'ios' | 'android';
  pushToken: string;
};

export const deviceSessionsApi = {
  upsert(body: DeviceSessionUpsertRequest): Promise<{ ok: boolean; deviceId: string }> {
    return apiRequest<{ ok: boolean; deviceId: string }>('/device-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  },

  remove(deviceId: string): Promise<{ ok: boolean }> {
    return apiRequest<{ ok: boolean }>(`/device-sessions/${encodeURIComponent(deviceId)}`, {
      method: 'DELETE',
    });
  },
};
