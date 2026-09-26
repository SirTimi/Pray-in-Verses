import {
  loadOfflinePrayerPack,
  offlineManifest,
  type OfflinePrayerRecord,
} from '@/generated/offline-packs';

export type BundledChapterPrayerCount = {
  verse: number;
  prayerPointsCount: number;
};

export type BundledSearchPrayerResult = {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  theme: string;
  insight: string;
  scriptureText: string;
  prayerPoints: string[];
  prayerPointsCount: number;
};

function slugifyBook(book: string) {
  return String(book)
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function getPack(book: string) {
  return loadOfflinePrayerPack(slugifyBook(book));
}

export function getBundledBooks() {
  return offlineManifest.books.map((entry) => entry.book);
}

export function getBundledChapters(book: string) {
  const pack = getPack(book);
  if (!pack) return [];

  return [...new Set(pack.prayers.map((item) => item.chapter))]
    .sort((a, b) => a - b);
}

export function getBundledVerses(book: string, chapter: number) {
  const pack = getPack(book);
  if (!pack) return [];

  return pack.prayers
    .filter((item) => item.chapter === chapter)
    .map((item) => item.verse)
    .sort((a, b) => a - b);
}

export function getBundledChapterCounts(
  book: string,
  chapter: number,
): BundledChapterPrayerCount[] {
  const pack = getPack(book);
  if (!pack) return [];

  return pack.prayers
    .filter((item) => item.chapter === chapter)
    .map((item) => ({
      verse: item.verse,
      prayerPointsCount: Array.isArray(item.prayerPoints)
        ? item.prayerPoints.length
        : 0,
    }))
    .sort((a, b) => a.verse - b.verse);
}

export function getBundledPrayerDetail(
  book: string,
  chapter: number,
  verse: number,
): OfflinePrayerRecord | null {
  const pack = getPack(book);
  if (!pack) return null;

  return (
    pack.prayers.find(
      (item) =>
        item.chapter === chapter &&
        item.verse === verse,
    ) ?? null
  );
}

export function getBundledVerseOfTheDay(): OfflinePrayerRecord | null {
  if (offlineManifest.totalPrayers <= 0) return null;

  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();

  let index = seed % offlineManifest.totalPrayers;

  for (const entry of offlineManifest.books) {
    const pack = loadOfflinePrayerPack(entry.slug);
    if (!pack) continue;

    if (index < pack.prayers.length) {
      return pack.prayers[index] ?? null;
    }

    index -= pack.prayers.length;
  }

  return null;
}

export function searchBundledPrayers(
  query: string,
  limit = 50,
): BundledSearchPrayerResult[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  const results: BundledSearchPrayerResult[] = [];

  for (const entry of offlineManifest.books) {
    const pack = loadOfflinePrayerPack(entry.slug);
    if (!pack) continue;

    for (const item of pack.prayers) {
      const matches =
        item.book.toLowerCase().includes(term) ||
        item.theme.toLowerCase().includes(term) ||
        item.insight.toLowerCase().includes(term) ||
        item.scriptureText.toLowerCase().includes(term) ||
        item.prayerPoints.some((point) =>
          point.toLowerCase().includes(term),
        );

      if (!matches) continue;

      results.push({
        id: item.id,
        book: item.book,
        chapter: item.chapter,
        verse: item.verse,
        theme: item.theme,
        insight: item.insight,
        scriptureText: item.scriptureText,
        prayerPoints: item.prayerPoints,
        prayerPointsCount: item.prayerPoints.length,
      });

      if (results.length >= limit) {
        return results;
      }
    }
  }

  return results;
}
