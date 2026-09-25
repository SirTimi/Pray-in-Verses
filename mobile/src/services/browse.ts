import { apiRequest } from './api';
import { networkFirstWithPublicCache } from './offline-cache';

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
  return networkFirstWithPublicCache(
    'browse:books',
    async () => {
      const response = await apiRequest<{ books: string[] }>('/browse/books');
      return response.books;
    },
  );
}

export async function getChapters(book: string) {
  const key = `browse:chapters:${book.trim().toLowerCase()}`;

  return networkFirstWithPublicCache(
    key,
    async () => {
      const response = await apiRequest<{ data: number[] }>(
        `/browse/books/${encodeURIComponent(book)}/chapters`,
      );
      return response.data;
    },
  );
}

export async function getVerses(book: string, chapter: number) {
  const key = `browse:verses:${book.trim().toLowerCase()}:${chapter}`;

  return networkFirstWithPublicCache(
    key,
    async () => {
      const response = await apiRequest<{ data: number[] }>(
        `/browse/books/${encodeURIComponent(book)}/chapters/${chapter}/verses`,
      );
      return response.data;
    },
  );
}

export async function getChapterCounts(book: string, chapter: number) {
  const key = `browse:counts:${book.trim().toLowerCase()}:${chapter}`;

  return networkFirstWithPublicCache(
    key,
    async () => {
      const response = await apiRequest<{ data: ChapterPrayerCount[] }>(
        `/browse/books/${encodeURIComponent(book)}/chapters/${chapter}/counts`,
      );
      return response.data;
    },
  );
}

export async function getVerseOfTheDay() {
  return networkFirstWithPublicCache(
    'browse:verse-of-the-day:latest',
    async () => {
      const response = await apiRequest<{ data: VerseOfTheDay | null }>(
        '/browse/verse-of-the-day',
      );
      return response.data;
    },
  );
}

export async function searchPrayers(query: string) {
  const term = query.trim();
  const key = `browse:search:${term.toLowerCase()}`;

  return networkFirstWithPublicCache(
    key,
    async () => {
      const response = await apiRequest<{ data: SearchPrayerResult[] }>(
        `/browse/search?q=${encodeURIComponent(term)}`,
      );
      return response.data;
    },
  );
}

export async function getPrayerWallPreview(limit = 3) {
  const response = await apiRequest<{
    data: PrayerWallPreview[];
    nextCursor: string | null;
  }>(`/prayer-wall?limit=${Math.max(1, Math.min(limit, 10))}`);

  return response.data;
}
