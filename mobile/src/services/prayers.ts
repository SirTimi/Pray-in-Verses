import { apiRequest } from './api';
import { networkFirstWithPublicCache } from './offline-cache';

export type CuratedPrayerDetail = {
  id: string;
  book: string;
  reference: string;
  theme: string;
  scriptureText: string;
  insight: string;
  prayerPoints: string[];
  closing: string;
  chapter: number;
  verse: number;
  isSaved: boolean;
  savedPointIndexes: number[];
  savedPointsCount: number;
};

export async function getPrayerDetail(
  book: string,
  chapter: number,
  verse: number,
) {
  const key =
    `browse:prayer:${book.trim().toLowerCase()}:${chapter}:${verse}`;

  return networkFirstWithPublicCache(
    key,
    async () => {
      const response = await apiRequest<{ data: CuratedPrayerDetail }>(
        `/browse/verse/${encodeURIComponent(book)}/${chapter}/${verse}`,
      );

      return response.data;
    },
    {
      cacheValue: (value) => ({
        ...value,
        isSaved: false,
        savedPointIndexes: [],
        savedPointsCount: 0,
      }),
    },
  );
}

export async function savePrayer(curatedPrayerId: string) {
  return apiRequest<{ ok: true }>(`/saved-prayers/${curatedPrayerId}`, {
    method: 'POST',
  });
}

export async function unsavePrayer(curatedPrayerId: string) {
  return apiRequest<{ ok: true }>(`/saved-prayers/${curatedPrayerId}`, {
    method: 'DELETE',
  });
}

export async function savePrayerPoint(curatedPrayerId: string, index: number) {
  return apiRequest<{ ok: true }>(
    `/saved-prayers/${curatedPrayerId}/points/${index}`,
    { method: 'POST' },
  );
}

export async function unsavePrayerPoint(curatedPrayerId: string, index: number) {
  return apiRequest<{ ok: true }>(
    `/saved-prayers/${curatedPrayerId}/points/${index}`,
    { method: 'DELETE' },
  );
}

export async function createJournalEntry(payload: {
  title: string;
  body: string;
  mood?: string;
}) {
  return apiRequest<{ data?: unknown; id?: string }>('/journals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
