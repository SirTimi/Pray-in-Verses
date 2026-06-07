// src/modules/admin-curated/admin-curated.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCuratedPrayerDto, UpdateCuratedPrayerDto } from './dto';
import { PublishState, Role } from '@prisma/client';

function asPublishState(val?: string): PublishState | undefined {
  if (!val) return undefined;
  const up = String(val).toUpperCase().trim();
  return (Object.keys(PublishState) as string[]).includes(up)
    ? (up as PublishState)
    : undefined;
}

@Injectable()
export class AdminCuratedService {
  constructor(private prisma: PrismaService) {}

  // ---------- list / create / read / update / transition / remove ----------
  async list(
    userRole: Role,
    q?: string,
    state?: PublishState | string,
    book?: string,
    chapter?: number | string,
    verse?: number | string,
    limit = 20,
    cursor?: string | null,
  ) {
    const where: any = {};
    if (book) where.book = { equals: book, mode: 'insensitive' };

    // chapter / verse exact filters (only when a valid positive int is given)
    const chapterNum = Number(chapter);
    if (Number.isInteger(chapterNum) && chapterNum > 0) where.chapter = chapterNum;
    const verseNum = Number(verse);
    if (Number.isInteger(verseNum) && verseNum > 0) where.verse = verseNum;

    if (q) {
      where.OR = [
        { theme: { contains: q, mode: 'insensitive' } },
        { scriptureText: { contains: q, mode: 'insensitive' } },
        { insight: { contains: q, mode: 'insensitive' } },
      ];
    }
    const st = asPublishState(state as string | undefined);
    if (st) where.state = st;

    // defend limit
    const take = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const rows = await this.prisma.curatedPrayer.findMany({
      where,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ state: 'asc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        book: true,
        chapter: true,
        verse: true,
        theme: true,
        state: true,
        updatedAt: true,
        publishedAt: true,
        createdById: true,
        updatedById: true,
      },
    });

    let nextCursor: string | null = null;
    if (rows.length > take) {
      const next = rows.pop()!;
      nextCursor = next.id;
    }
    return { items: rows, nextCursor };
  }

  async create(userId: string, dto: CreateCuratedPrayerDto) {
    try {
      const data = await this.prisma.curatedPrayer.create({
        data: {
          ...dto,
          state: PublishState.DRAFT,
          createdById: userId,
          updatedById: userId,
        },
      });
      return { data };
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new BadRequestException(
          'A curated entry already exists for this book/chapter/verse.',
        );
      }
      throw e;
    }
  }

  async get(id: string) {
    const row = await this.prisma.curatedPrayer.findUnique({ where: { id } });
    if (!row) throw new NotFoundException();
    return { data: row };
  }

  private assertCanEditRow(row: any, userId: string, userRole: Role) {
    const isElevated = userRole === 'MODERATOR' || userRole === 'SUPER_ADMIN';
    const owns = row.createdById === userId;

    if (!isElevated) {
      if (!owns) {
        throw new ForbiddenException('You can only edit your own drafts');
      }
      if (!(row.state === 'DRAFT' || row.state === 'REVIEW')) {
        throw new ForbiddenException(
          'Only DRAFT/REVIEW items can be edited by editors',
        );
      }
    }
    if (row.state === 'ARCHIVED' && !isElevated) {
      throw new ForbiddenException('Archived item cannot be edited by editor');
    }
  }

  private async getRowForEdit(id: string, userId: string, userRole: Role) {
    const row = await this.prisma.curatedPrayer.findUnique({ where: { id } });
    if (!row) throw new NotFoundException();
    this.assertCanEditRow(row, userId, userRole);
    return row;
  }

  async update(
    userId: string,
    userRole: Role,
    id: string,
    dto: UpdateCuratedPrayerDto,
  ) {
    const row = await this.getRowForEdit(id, userId, userRole);

    // keep reference unique if changing
    if (dto.book || dto.chapter || dto.verse) {
      const book = dto.book ?? row.book;
      const chapter = dto.chapter ?? row.chapter;
      const verse = dto.verse ?? row.verse;
      const dupe = await this.prisma.curatedPrayer.findFirst({
        where: {
          book: { equals: book, mode: 'insensitive' },
          chapter,
          verse,
          NOT: { id },
        },
        select: { id: true },
      });
      if (dupe)
        throw new BadRequestException(
          'Another entry already exists for that reference',
        );
    }

    // IMPORTANT: String[] fields must use { set: [...] } when replacing
    const dataUpdate: any = { ...dto, updatedById: userId };
    if (dto.prayerPoints) {
      const cleaned = dto.prayerPoints.map((s) => s?.trim()).filter(Boolean);
      dataUpdate.prayerPoints = { set: cleaned };
    }

    const updated = await this.prisma.curatedPrayer.update({
      where: { id },
      data: dataUpdate,
    });
    return { data: updated };
  }

  /** Preconditions for publishing */
  private ensurePublishPreconditions(row: {
    book?: string;
    chapter?: number;
    verse?: number;
    theme?: string;
    scriptureText?: string;
    insight?: string;
    closing?: string;
    prayerPoints?: string[];
  }) {
    const errs: string[] = [];
    if (!row.book) errs.push('book');
    if (!row.chapter) errs.push('chapter');
    if (!row.verse) errs.push('verse');
    if (!row.theme?.trim()) errs.push('theme');
    if (!row.scriptureText?.trim()) errs.push('scriptureText');
    if (!row.insight?.trim()) errs.push('insight');
    if (!row.closing?.trim()) errs.push('closing');
    if (!row.prayerPoints || row.prayerPoints.length === 0)
      errs.push('prayerPoints (at least one)');
    if (errs.length) {
      throw new BadRequestException(
        `Cannot publish: missing/empty fields → ${errs.join(', ')}`,
      );
    }
  }

  async transition(
    userId: string,
    userRole: Role,
    id: string,
    target: PublishState,
  ) {
    const row = await this.prisma.curatedPrayer.findUnique({ where: { id } });
    if (!row) throw new NotFoundException();

    const isElevated = userRole === 'MODERATOR' || userRole === 'SUPER_ADMIN';
    const owns = row.createdById === userId;

    // REVIEW
    if (target === 'REVIEW') {
      if (row.state === 'DRAFT') {
        if (!owns && !isElevated)
          throw new ForbiddenException(
            'Only the owner can submit draft to review',
          );
        return this._setState(id, 'REVIEW', userId);
      }
      if (row.state === 'PUBLISHED') {
        if (!isElevated)
          throw new ForbiddenException(
            'Only moderator/super admin can unpublish',
          );
        return this._setState(id, 'REVIEW', userId, false);
      }
      if (row.state === 'REVIEW') return { data: row, ok: true };
      if (row.state === 'ARCHIVED') {
        if (!isElevated)
          throw new ForbiddenException(
            'Only moderator/super admin can restore from archive',
          );
        return this._setState(id, 'REVIEW', userId);
      }
      throw new BadRequestException(`Invalid transition: ${row.state} → REVIEW`);
    }

    // PUBLISHED
    if (target === 'PUBLISHED') {
      if (!isElevated)
        throw new ForbiddenException('Only moderator/super admin can publish');
      if (!(row.state === 'REVIEW' || row.state === 'DRAFT')) {
        throw new BadRequestException('Only DRAFT/REVIEW can be published');
      }

      this.ensurePublishPreconditions(row);

      // uniqueness among PUBLISHED
      const conflict = await this.prisma.curatedPrayer.findFirst({
        where: {
          state: 'PUBLISHED',
          book: { equals: row.book, mode: 'insensitive' },
          chapter: row.chapter,
          verse: row.verse,
          NOT: { id: row.id },
        },
        select: { id: true },
      });
      if (conflict) {
        throw new BadRequestException(
          `Another published entry already exists for ${row.book} ${row.chapter}:${row.verse}. Unpublish it first.`,
        );
      }

      return this._setState(id, 'PUBLISHED', userId, true);
    }

    // ARCHIVED
    if (target === 'ARCHIVED') {
      if (!isElevated)
        throw new ForbiddenException('Only moderator/super admin can archive');
      return this._setState(id, 'ARCHIVED', userId);
    }

    throw new BadRequestException(
      'Invalid transition. Allowed targets are: REVIEW, PUBLISHED, ARCHIVED',
    );
  }

  private async _setState(
    id: string,
    state: PublishState,
    userId: string,
    publish = false,
  ) {
    const data: any = { state, updatedById: userId, updatedAt: new Date() };
    if (publish) data.publishedAt = new Date();
    const updated = await this.prisma.curatedPrayer.update({ where: { id }, data });
    return { data: updated, ok: true };
  }

  async remove(userId: string, userRole: Role, id: string) {
    const row = await this.prisma.curatedPrayer.findUnique({ where: { id } });
    if (!row) throw new NotFoundException();

    const isElevated = userRole === 'MODERATOR' || userRole === 'SUPER_ADMIN';
    const owns = row.createdById === userId;

    // Editors can delete only their own DRAFTs
    if (!isElevated) {
      if (!owns) throw new ForbiddenException('You can only delete your own drafts');
      if (row.state !== 'DRAFT') {
        throw new ForbiddenException('Only DRAFT can be deleted by editor');
      }
    }

    await this.prisma.savedPrayer.deleteMany({ where: { curatedPrayerId: id } });
    await this.prisma.curatedPrayer.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- Per-point editing (PRISMA array operators) ----------

  /** Replace the entire prayerPoints array (may be empty). */
  async replacePrayerPoints(id: string, items: string[]) {
    const clean = (items || [])
      .map((s) => (s ?? '').trim())
      .filter(Boolean);
    const updated = await this.prisma.curatedPrayer.update({
      where: { id },
      data: { prayerPoints: { set: clean } },
      select: { id: true, prayerPoints: true, updatedAt: true },
    });
    return { ok: true, data: updated };
  }

  /** Append a new point to the end of the list. */
  async appendPrayerPoint(id: string, text: string) {
    const t = (text ?? '').trim();
    if (!t) throw new BadRequestException('Text is required');
    const updated = await this.prisma.curatedPrayer.update({
      where: { id },
      data: { prayerPoints: { push: t } },
      select: { id: true, prayerPoints: true },
    });
    return { ok: true, data: updated };
  }

  /** Update a specific index (0-based). */
  async updatePrayerPointAt(id: string, index: number, text: string) {
    const t = (text ?? '').trim();
    if (!t) throw new BadRequestException('Text is required');

    const row = await this.prisma.curatedPrayer.findUnique({
      where: { id },
      select: { prayerPoints: true },
    });
    if (!row) throw new NotFoundException();

    const pts = [...(row.prayerPoints || [])];
    if (index < 0 || index >= pts.length)
      throw new BadRequestException('Index out of range');

    pts[index] = t;

    const updated = await this.prisma.curatedPrayer.update({
      where: { id },
      data: { prayerPoints: { set: pts } },
      select: { id: true, prayerPoints: true },
    });
    return { ok: true, data: updated };
  }

  /** Remove a point at index. */
  async removePrayerPointAt(id: string, index: number) {
    const row = await this.prisma.curatedPrayer.findUnique({
      where: { id },
      select: { prayerPoints: true },
    });
    if (!row) throw new NotFoundException();

    const pts = [...(row.prayerPoints || [])];
    if (index < 0 || index >= pts.length)
      throw new BadRequestException('Index out of range');

    pts.splice(index, 1);

    const updated = await this.prisma.curatedPrayer.update({
      where: { id },
      data: { prayerPoints: { set: pts } },
      select: { id: true, prayerPoints: true },
    });
    return { ok: true, data: updated };
  }

  /** Move a point from index `from` to `to`. */
  async reorderPrayerPoints(id: string, from: number, to: number) {
    const row = await this.prisma.curatedPrayer.findUnique({
      where: { id },
      select: { prayerPoints: true },
    });
    if (!row) throw new NotFoundException();

    const pts = [...(row.prayerPoints || [])];
    if (from < 0 || from >= pts.length || to < 0 || to >= pts.length) {
      throw new BadRequestException('Index out of range');
    }

    const [moved] = pts.splice(from, 1);
    pts.splice(to, 0, moved);

    const updated = await this.prisma.curatedPrayer.update({
      where: { id },
      data: { prayerPoints: { set: pts } },
      select: { id: true, prayerPoints: true },
    });
    return { ok: true, data: updated };
  }
}
