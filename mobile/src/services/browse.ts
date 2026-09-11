import { apiRequest } from './api';

export type VerseOfTheDay = {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  theme: string;
  scriptureText: string;
  insight: string;
  prayerPoints: string[];
  closing: string;
};

export type ChapterPrayerCount = {
  verse: number;
  prayerPointsCount: number;
};

export type SearchPrayerResult = {
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

export type PrayerWallPreview = {
  id: string;
  title: string;
  description: string;
  category: string;
  urgent: boolean;
  anonymous: boolean;
  createdAt: string;
  _count?: {
    likes: number;
    comments: number;
    bookmarks: number;
  };
};

export async function getBooks() {
  const response = await apiRequest<{ books: string[] }>('/browse/books');
  return response.books;
}

export async function getChapters(book: string) {
  const response = await apiRequest<{ data: number[] }>(
    `/browse/books/${encodeURIComponent(book)}/chapters`,
  );
  return response.data;
}

export async function getVerses(book: string, chapter: number) {
  const response = await apiRequest<{ data: number[] }>(
    `/browse/books/${encodeURIComponent(book)}/chapters/${chapter}/verses`,
  );
  return response.data;
}

export async function getChapterCounts(book: string, chapter: number) {
  const response = await apiRequest<{ data: ChapterPrayerCount[] }>(
    `/browse/books/${encodeURIComponent(book)}/chapters/${chapter}/counts`,
  );
  return response.data;
}

export async function getVerseOfTheDay() {
  const response = await apiRequest<{ data: VerseOfTheDay | null }>(
    '/browse/verse-of-the-day',
  );
  return response.data;
}

export async function searchPrayers(query: string) {
  const response = await apiRequest<{ data: SearchPrayerResult[] }>(
    `/browse/search?q=${encodeURIComponent(query.trim())}`,
  );
  return response.data;
}

export async function getPrayerWallPreview(limit = 3) {
  const response = await apiRequest<{
    data: PrayerWallPreview[];
    nextCursor: string | null;
  }>(`/prayer-wall?limit=${Math.max(1, Math.min(limit, 10))}`);

  return response.data;
}
