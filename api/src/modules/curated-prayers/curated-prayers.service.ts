import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PublishState } from '@prisma/client';

@Injectable()
export class CuratedPrayersService {
  constructor(private prisma: PrismaService) {}

  // —————————————————————————
  // Books / Chapters / Verses
  // —————————————————————————
  async listBooks() {
    const rows = await this.prisma.curatedPrayer.groupBy({
      by: ['book'],
      where: { state: PublishState.PUBLISHED },
      _count: { _all: true },
    });
    return rows.map((r) => r.book).sort((a, b) => a.localeCompare(b));
  }

  async listChapters(book: string) {
    const rows = await this.prisma.curatedPrayer.groupBy({
      by: ['chapter'],
      where: {
        state: PublishState.PUBLISHED,
        book: { equals: book, mode: 'insensitive' },
      },
      _count: { _all: true },
    });
    return rows.map((r) => r.chapter).sort((a, b) => a - b);
  }

  async listVerses(book: string, chapter: number) {
    const rows = await this.prisma.curatedPrayer.findMany({
      where: {
        state: PublishState.PUBLISHED,
        book: { equals: book, mode: 'insensitive' },
        chapter,
      },
      select: { verse: true },
      orderBy: { verse: 'asc' },
    });
    return rows.map((r) => r.verse);
  }

  // —————————————————————————
  // One verse (with saved status)
  // —————————————————————————
  async getByRef(book: string, chapter: number, verse: number, userId?: string) {
    const item = await this.prisma.curatedPrayer.findFirst({
      where: {
        state: PublishState.PUBLISHED,
        book: { equals: book, mode: 'insensitive' },
        chapter,
        verse,
      },
    });

    if (!item) throw new NotFoundException('Verse content not found');

    let whole: { id: string } | null = null;
    let savedPointIndexes: number[] = [];

    if (userId) {
      whole = await this.prisma.savedPrayer.findFirst({
        where: { userId, curatedPrayerId: item.id, pointIndex: null },
        select: { id: true },
      });

      const pointRows = await this.prisma.savedPrayer.findMany({
        where: { userId, curatedPrayerId: item.id, NOT: { pointIndex: null } },
        select: { pointIndex: true },
      });

      savedPointIndexes = pointRows
        .map((r) => r.pointIndex)
        .filter((n): n is number => typeof n === 'number' && n >= 0);
    }

    return {
      id: item.id,
      book: item.book,
      reference: `${item.book} ${item.chapter}:${item.verse}`,
      theme: item.theme,
      scriptureText: item.scriptureText,
      insight: item.insight,
      prayerPoints: item.prayerPoints,
      closing: item.closing,
      chapter: item.chapter,
      verse: item.verse,
      isSaved: !!whole,                 // whole entry saved?
      savedPointIndexes,                // indices of saved points
      savedPointsCount: savedPointIndexes.length,
    };
  }

  // —————————————————————————
  // Verse of the Day (deterministic daily pick)
  // —————————————————————————
  async verseOfTheDay() {
    const count = await this.prisma.curatedPrayer.count({
      where: { state: PublishState.PUBLISHED },
    });
    if (!count) return null;

    const today = new Date();
    const seed =
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate();
    const index = seed % count;

    const rows = await this.prisma.curatedPrayer.findMany({
      where: { state: PublishState.PUBLISHED },
      orderBy: [{ book: 'asc' }, { chapter: 'asc' }, { verse: 'asc' }, { updatedAt: 'desc' }],
      skip: index,
      take: 1,
      select: {
        id: true,
        book: true,
        chapter: true,
        verse: true,
        theme: true,
        scriptureText: true,
        insight: true,
        prayerPoints: true,
        closing: true,
      },
    });

    return rows[0] ?? null;
  }

  // Keep backward-compat name if something already calls it
  async verseofTheDay() {
    return this.verseOfTheDay();
  }

  // —————————————————————————
  // Per-verse prayer-points count for a chapter
  // —————————————————————————
  async chapterCounts(book: string, chapter: number) {
    const rows = await this.prisma.curatedPrayer.findMany({
      where: {
        state: PublishState.PUBLISHED,
        book: { equals: book, mode: 'insensitive' },
        chapter,
      },
      select: { verse: true, prayerPoints: true },
      orderBy: { verse: 'asc' },
    });

    const map = new Map<number, number>();
    for (const r of rows) {
      const cnt = Array.isArray(r.prayerPoints) ? r.prayerPoints.length : 0;
      map.set(r.verse, (map.get(r.verse) || 0) + cnt);
    }

    return Array.from(map.entries())
      .map(([verse, prayerPointsCount]) => ({ verse, prayerPointsCount }))
      .sort((a, b) => a.verse - b.verse);
  }

  // —————————————————————————
  // Search (books, theme, insight, scriptureText + prayerPoints)
  // NOTE: hasSome is exact-item match inside string[] prayerPoints.
  // If you want substring within items, we can switch to a raw SQL approach.
  // —————————————————————————
  async search(q: string) {
    const term = (q || '').trim();
    if (!term) return [];

    const rows = await this.prisma.curatedPrayer.findMany({
      where: {
        state: PublishState.PUBLISHED,
        OR: [
          { book: { contains: term, mode: 'insensitive' } },
          { theme: { contains: term, mode: 'insensitive' } },
          { insight: { contains: term, mode: 'insensitive' } },
          { scriptureText: { contains: term, mode: 'insensitive' } },
          { prayerPoints: { hasSome: [term] } }, // exact item match
        ],
      },
      select: {
        id: true,
        book: true,
        chapter: true,
        verse: true,
        theme: true,
        insight: true,
        scriptureText: true,
        prayerPoints: true,
      },
      orderBy: [{ book: 'asc' }, { chapter: 'asc' }, { verse: 'asc' }],
      take: 50,
    });

    return rows.map((r) => ({
      ...r,
      prayerPointsCount: Array.isArray(r.prayerPoints) ? r.prayerPoints.length : 0,
    }));
  }

  async publishedPointsCount(){
    const rows = await this.prisma.curatedPrayer.findMany({
      where: { state: PublishState.PUBLISHED },
      select: { prayerPoints: true },
    });
    let total = 0;
    for (const r of rows) {
      total += Array.isArray(r.prayerPoints) ? r.prayerPoints.length: 0;
    }
    return total;
  }

  async totalPrayerPoints() {
    const rows = await this.prisma.curatedPrayer.findMany({
      where: {state: PublishState.PUBLISHED },
      select: { prayerPoints : true},
    });
    return rows.reduce((sum, r) => sum + (Array.isArray(r.prayerPoints) ? r.prayerPoints.length : 0), 0);
  }
}
