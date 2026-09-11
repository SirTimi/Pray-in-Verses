import { apiRequest } from './api';

export type SavedCuratedPrayer = {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  theme: string;
  scriptureText: string;
  insight: string;
  prayerPoints: string[];
  closing: string;
  state?: string;
  publishedAt?: string | null;
};

export type SavedPrayerRow = {
  id: string;
  curatedPrayerId: string;
  pointIndex: number | null;
  createdAt: string;
  curatedPrayer: SavedCuratedPrayer;
};

export type SavedPrayerGroup = {
  curatedPrayerId: string;
  curatedPrayer: SavedCuratedPrayer;
  savedAt: string;
  wholeSaved: boolean;
  savedPointIndexes: number[];
};

export async function listSavedPrayers() {
  const response = await apiRequest<{ data: SavedPrayerRow[] }>('/saved-prayers');
  const groups = new Map<string, SavedPrayerGroup>();

  for (const row of response.data ?? []) {
    if (!row?.curatedPrayerId || !row.curatedPrayer) continue;

    const existing = groups.get(row.curatedPrayerId);
    const pointIndexes = existing?.savedPointIndexes ?? [];

    if (typeof row.pointIndex === 'number' && !pointIndexes.includes(row.pointIndex)) {
      pointIndexes.push(row.pointIndex);
      pointIndexes.sort((a, b) => a - b);
    }

    groups.set(row.curatedPrayerId, {
      curatedPrayerId: row.curatedPrayerId,
      curatedPrayer: row.curatedPrayer,
      savedAt:
        !existing || new Date(row.createdAt).getTime() > new Date(existing.savedAt).getTime()
          ? row.createdAt
          : existing.savedAt,
      wholeSaved: (existing?.wholeSaved ?? false) || row.pointIndex === null,
      savedPointIndexes: pointIndexes,
    });
  }

  return Array.from(groups.values()).sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );
}

export async function removeSavedPrayerGroup(group: SavedPrayerGroup) {
  const tasks: Promise<unknown>[] = [];

  if (group.wholeSaved) {
    tasks.push(
      apiRequest<{ ok: true }>(`/saved-prayers/${group.curatedPrayerId}`, {
        method: 'DELETE',
      }),
    );
  }

  for (const index of group.savedPointIndexes) {
    tasks.push(
      apiRequest<{ ok: true }>(
        `/saved-prayers/${group.curatedPrayerId}/points/${index}`,
        { method: 'DELETE' },
      ),
    );
  }

  await Promise.all(tasks);
}
