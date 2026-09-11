import { apiRequest } from './api';

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
  const response = await apiRequest<{ data: CuratedPrayerDetail }>(
    `/browse/verse/${encodeURIComponent(book)}/${chapter}/${verse}`,
  );

  return response.data;
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
