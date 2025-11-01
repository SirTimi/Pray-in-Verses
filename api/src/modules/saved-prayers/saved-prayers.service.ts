import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SavedPrayersService {
  constructor(private prisma: PrismaService) {}

  /**
   * List saved prayers for the user. Includes pointIndex so the UI
   * can reflect per-point saved state. Supports cursor pagination.
   */
  async list(userId: string, limit = 20, cursor?: string | null) {
    const rows = await this.prisma.savedPrayer.findMany({
      where: { userId },
      include: {
        curatedPrayer: {
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
            state: true,
            publishedAt: true,
          },
        },
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });

    let nextCursor: string | null = null;
    if (rows.length > limit) {
      const next = rows.pop()!;
      nextCursor = next.id;
    }

    return {
      data: rows.map((r) => ({
        id: r.id, // saved-prayer row id
        curatedPrayerId: r.curatedPrayerId,
        pointIndex: r.pointIndex,          // null = whole entry, number = specific point
        createdAt: r.createdAt,

        // Keep the full curated entry so the consumer has context
        curatedPrayer: r.curatedPrayer,

        // (Optional legacy fields kept for compatibility)
        reference: `${r.curatedPrayer.book} ${r.curatedPrayer.chapter}:${r.curatedPrayer.verse}`,
        theme: r.curatedPrayer.theme,
        scriptureText: r.curatedPrayer.scriptureText,
        insight: r.curatedPrayer.insight,
        prayerPoints: r.curatedPrayer.prayerPoints,
        closing: r.curatedPrayer.closing,
        isSaved: true,
      })),
      nextCursor,
    };
  }

  /**
   * Save WHOLE curated entry (pointIndex = null).
   * Uses create + swallow P2002 duplicates for simplicity.
   */
  async save(userId: string, curatedPrayerId: string) {
    const exists = await this.prisma.curatedPrayer.findUnique({
      where: { id: curatedPrayerId },
      select: { id: true },
    });
    if (!exists) throw new BadRequestException('Curated prayer not found');

    await this.prisma.savedPrayer
      .create({
        data: { userId, curatedPrayerId, pointIndex: null },
      })
      .catch((e: unknown) => {
        // Ignore unique constraint violation (= already saved)
        if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') {
          throw e;
        }
      });

    return { ok: true };
  }

  /**
   * Unsave WHOLE curated entry (removes only pointIndex = null).
   */
  async unsave(userId: string, curatedPrayerId: string) {
    await this.prisma.savedPrayer.deleteMany({
      where: { userId, curatedPrayerId, pointIndex: null },
    });
    return { ok: true };
  }

  /**
   * Save ONE prayer point by index.
   */
  async savePoint(userId: string, curatedPrayerId: string, index: number) {
    if (!Number.isInteger(index) || index < 0) {
      throw new BadRequestException('Invalid index');
    }

    const exists = await this.prisma.curatedPrayer.findUnique({
      where: { id: curatedPrayerId },
      select: { id: true },
    });
    if (!exists) throw new BadRequestException('Curated prayer not found');

    await this.prisma.savedPrayer
      .create({
        data: { userId, curatedPrayerId, pointIndex: index },
      })
      .catch((e: unknown) => {
        if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') {
          throw e;
        }
      });

    return { ok: true };
  }

  /**
   * Unsave ONE prayer point by index.
   */
  async unsavePoint(userId: string, curatedPrayerId: string, index: number) {
    if (!Number.isInteger(index) || index < 0) {
      throw new BadRequestException('Invalid index');
    }

    await this.prisma.savedPrayer.deleteMany({
      where: { userId, curatedPrayerId, pointIndex: index },
    });

    return { ok: true };
  }
}
