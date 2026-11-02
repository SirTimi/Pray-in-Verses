import { apiRequest } from './api';

export const PRAYER_WALL_CATEGORIES = [
  'Healing',
  'Provision',
  'Family',
  'Career',
  'Relationship',
  'Financial',
  'Spiritual',
  'Guidance',
  'Thanksgiving',
  'Other',
] as const;

export type PrayerWallCategory = (typeof PRAYER_WALL_CATEGORIES)[number];

export type PrayerWallCounts = {
  likes: number;
  comments: number;
  bookmarks: number;
};

export type PrayerWallRequest = {
  id: string;
  title: string;
  description: string;
  category: string;
  urgent: boolean;
  anonymous: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: PrayerWallCounts;
};

export type PrayerWallComment = {
  id: string;
  body: string;
  userId: string;
  requestId: string;
  createdAt: string;
  user?: {
    id: string;
    displayName: string | null;
  };
};

export type PrayerWallRequestDetail = PrayerWallRequest & {
  comments?: PrayerWallComment[];
};

export async function listPrayerRequests(options?: {
  q?: string;
  category?: string;
  cursor?: string;
  limit?: number;
}) {
  const params: string[] = [];

  if (options?.q?.trim()) {
    params.push(`q=${encodeURIComponent(options.q.trim())}`);
  }

  if (options?.category?.trim()) {
    params.push(`category=${encodeURIComponent(options.category.trim())}`);
  }

  if (options?.cursor) {
    params.push(`cursor=${encodeURIComponent(options.cursor)}`);
  }

  params.push(`limit=${Math.max(1, Math.min(options?.limit ?? 20, 50))}`);

  return apiRequest<{
    data: PrayerWallRequest[];
    nextCursor: string | null;
  }>(`/prayer-wall?${params.join('&')}`);
}

export async function getPrayerRequest(id: string) {
  const response = await apiRequest<{ data: PrayerWallRequestDetail }>(
    `/prayer-wall/${encodeURIComponent(id)}`,
  );

  return response.data;
}

export async function createPrayerRequest(payload: {
  title: string;
  description: string;
  category: string;
  urgent?: boolean;
  anonymous?: boolean;
}) {
  const response = await apiRequest<{ data: PrayerWallRequest }>('/prayer-wall', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function togglePrayerRequestLike(id: string) {
  return apiRequest<{ liked: boolean }>(`/prayer-wall/${encodeURIComponent(id)}/like`, {
    method: 'POST',
  });
}

export async function togglePrayerRequestBookmark(id: string) {
  return apiRequest<{ bookmarked: boolean }>(
    `/prayer-wall/${encodeURIComponent(id)}/bookmark`,
    { method: 'POST' },
  );
}

export async function addPrayerRequestComment(id: string, body: string) {
  const response = await apiRequest<{ data: PrayerWallComment }>(
    `/prayer-wall/${encodeURIComponent(id)}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({ body }),
    },
  );

  return response.data;
}

export async function lookupDisplayNames(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return {} as Record<string, string>;

  const response = await apiRequest<{
    map: Record<string, { id: string; displayName: string }>;
  }>(`/identity/lookup?ids=${encodeURIComponent(uniqueIds.join(','))}`);

  return Object.fromEntries(
    Object.entries(response.map).map(([id, user]) => [id, user.displayName || 'User']),
  );
}

export type ReportReason = 'HARASSMENT' | 'HATE' | 'THREATS' | 'SPAM' | 'PRIVACY' | 'OTHER';
export type ReportTarget = 'REQUEST' | 'COMMENT';

export async function reportPrayerContent(payload: {
  targetType: ReportTarget;
  targetId: string;
  reason: ReportReason;
  details?: string;
}) {
  return apiRequest<{ ok: true; id: string }>('/prayer-wall/reports', {
    method: 'POST', body: JSON.stringify(payload),
  });
}

export async function blockPrayerAuthor(payload: {
  requestId?: string;
  commentId?: string;
}) {
  return apiRequest<{ ok: true }>('/prayer-wall/blocks', {
    method: 'POST', body: JSON.stringify(payload),
  });
}

export type BlockedAccount = { id: string; createdAt: string };

export async function listBlockedAccounts() {
  return apiRequest<{ data: BlockedAccount[] }>('/prayer-wall/blocks');
}

export async function unblockAccount(id: string) {
  return apiRequest<{ ok: true }>(`/prayer-wall/blocks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
