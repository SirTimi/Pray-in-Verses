import { apiRequest } from './api';

export type PrayerStatus = 'OPEN' | 'ANSWERED';
export type PrayerListStatus = 'ALL' | PrayerStatus;

export type PrayerPoint = {
  id: string;
  userId?: string;
  title: string;
  body: string;
  tags: string[];
  status: PrayerStatus;
  answeredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PrayerStats = {
  total: number;
  open: number;
  answered: number;
};

export type PrayerPointPayload = {
  title: string;
  body: string;
  tags?: string[];
};

export async function getPrayerStats() {
  return apiRequest<PrayerStats>('/my-prayers/stats');
}

export async function listMyPrayers(
  status: PrayerListStatus = 'ALL',
  query = '',
) {
  const params = new URLSearchParams();
  params.set('status', status);

  const trimmed = query.trim();
  if (trimmed) params.set('q', trimmed);

  const response = await apiRequest<{ data: PrayerPoint[] }>(
    `/my-prayers?${params.toString()}`,
  );

  return response.data;
}

export async function getMyPrayer(id: string) {
  const response = await apiRequest<{ data: PrayerPoint }>(
    `/my-prayers/${encodeURIComponent(id)}`,
  );

  return response.data;
}

export async function createMyPrayer(payload: PrayerPointPayload) {
  const response = await apiRequest<{ data: PrayerPoint }>('/my-prayers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function updateMyPrayer(
  id: string,
  payload: Partial<PrayerPointPayload> & { status?: PrayerStatus },
) {
  const response = await apiRequest<{ data: PrayerPoint }>(
    `/my-prayers/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );

  return response.data;
}

export async function toggleMyPrayer(id: string) {
  const response = await apiRequest<{ data: PrayerPoint }>(
    `/my-prayers/${encodeURIComponent(id)}/toggle`,
    { method: 'POST' },
  );

  return response.data;
}

export async function deleteMyPrayer(id: string) {
  return apiRequest<{ ok: true }>(`/my-prayers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
