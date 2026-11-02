import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PrayerReportStatus,
  PrayerReportTarget,
  type PrayerReportReason,
} from '@prisma/client';
import { assertAcceptableWallText } from './content-filter';

@Injectable()
export class PrayerWallService {
  constructor(private prisma: PrismaService) {}

  /**
   * Remove creator identity from anonymous prayer requests
   * before sending them back to clients.
   */
  private sanitizePrayerRequest(row: any) {
    if (!row) return row;

    return {
      ...row,

      // Never expose the creator ID for anonymous requests.
      createdById: row.anonymous
        ? null
        : row.createdById,
    };
  }

  private async excludedUserIds(userId: string): Promise<string[]> {
    const blocks = await this.prisma.userBlock.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });
    return [...new Set(blocks.map((block) =>
      block.blockerId === userId ? block.blockedId : block.blockerId,
    ))];
  }

  private async visiblePost(requestId: string, userId: string) {
    const request = await this.prisma.prayerRequest.findUnique({
      where: { id: requestId },
      select: { id: true, createdById: true, hidden: true },
    });
    if (!request || request.hidden ||
      (await this.excludedUserIds(userId)).includes(request.createdById)) {
      throw new NotFoundException('Prayer request not found');
    }
    return request;
  }

  async create(userId: string, dto: any) {
    assertAcceptableWallText(dto.title, dto.description);
    const data =
      await this.prisma.prayerRequest.create({
        data: {
          ...dto,
          createdById: userId,
        },
      });

    return {
      data: this.sanitizePrayerRequest(data),
    };
  }

  async list(
    userId: string,
    q?: string,
    category?: string,
    cursor?: string | null,
    limit = 20,
  ) {
    const blockedIds = await this.excludedUserIds(userId);
    const where: any = { hidden: false };
    if (blockedIds.length) {
      where.createdById = { notIn: blockedIds };
    }

    if (q) {
      where.OR = [
        {
          title: {
            contains: q,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: q,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (category) {
      where.category = {
        equals: category,
        mode: 'insensitive',
      };
    }

    // Defend against invalid / excessive limits.
    const take = Math.min(
      Math.max(Number(limit) || 20, 1),
      50,
    );

    const rows =
      await this.prisma.prayerRequest.findMany({
        where,

        take: take + 1,

        ...(cursor
          ? {
              cursor: {
                id: cursor,
              },
              skip: 1,
            }
          : {}),

        orderBy: [
          {
            urgent: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],

        include: {
          _count: {
            select: {
              likes: true,
              comments: { where: {
                hidden: false,
                ...(blockedIds.length ? { userId: { notIn: blockedIds } } : {}),
              } },
              bookmarks: true,
            },
          },
        },
      });

    let nextCursor: string | null = null;

    if (rows.length > take) {
      const next = rows.pop()!;
      nextCursor = next.id;
    }

    return {
      data: rows.map((row) =>
        this.sanitizePrayerRequest(row),
      ),
      nextCursor,
    };
  }

  async get(id: string, userId: string) {
    const blockedIds = await this.excludedUserIds(userId);
    const row =
      await this.prisma.prayerRequest.findUnique({
        where: {
          id,
        },

        include: {
          _count: {
            select: {
              likes: true,
              comments: { where: {
                hidden: false,
                ...(blockedIds.length ? { userId: { notIn: blockedIds } } : {}),
              } },
              bookmarks: true,
            },
          },

          comments: {
            where: {
              hidden: false,
              ...(blockedIds.length ? { userId: { notIn: blockedIds } } : {}),
            },
            orderBy: {
              createdAt: 'desc',
            },

            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                },
              },
            },
          },
        },
      });

    if (!row || row.hidden || blockedIds.includes(row.createdById)) {
      throw new NotFoundException();
    }

    return {
      data: this.sanitizePrayerRequest(row),
    };
  }

  async toggleLike(
    userId: string,
    requestId: string,
  ) {
    await this.visiblePost(requestId, userId);

    const existing =
      await this.prisma.prayerLike.findUnique({
        where: {
          userId_requestId: {
            userId,
            requestId,
          },
        },
      });

    if (existing) {
      await this.prisma.prayerLike.delete({
        where: {
          id: existing.id,
        },
      });

      return {
        liked: false,
      };
    }

    await this.prisma.prayerLike.create({
      data: {
        userId,
        requestId,
      },
    });

    return {
      liked: true,
    };
  }

  async toggleBookmark(
    userId: string,
    requestId: string,
  ) {
    await this.visiblePost(requestId, userId);

    const existing =
      await this.prisma.prayerBookmark.findUnique({
        where: {
          userId_requestId: {
            userId,
            requestId,
          },
        },
      });

    if (existing) {
      await this.prisma.prayerBookmark.delete({
        where: {
          id: existing.id,
        },
      });

      return {
        bookmarked: false,
      };
    }

    await this.prisma.prayerBookmark.create({
      data: {
        userId,
        requestId,
      },
    });

    return {
      bookmarked: true,
    };
  }

  async addComment(
    userId: string,
    requestId: string,
    body: string,
  ) {
    const text = (body ?? '').trim();

    if (!text) {
      throw new BadRequestException('Comment is required');
    }
    assertAcceptableWallText(text);
    await this.visiblePost(requestId, userId);

    const data =
      await this.prisma.prayerComment.create({
        data: {
          body: text,
          requestId,
          userId,
        },

        include: {
          user: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      });

    return {
      data,
    };
  }

  async report(userId: string, input: {
    targetType: PrayerReportTarget;
    targetId: string;
    reason: PrayerReportReason;
    details?: string;
  }) {
    const target = input.targetType === PrayerReportTarget.REQUEST
      ? await this.prisma.prayerRequest.findUnique({
          where: { id: input.targetId },
          select: { id: true, hidden: true },
        })
      : await this.prisma.prayerComment.findUnique({
          where: { id: input.targetId },
          select: { id: true, hidden: true },
        });
    if (!target || target.hidden) throw new NotFoundException('Content unavailable');

    const data = await this.prisma.prayerReport.upsert({
      where: {
        reporterId_targetType_targetId: {
          reporterId: userId,
          targetType: input.targetType,
          targetId: input.targetId,
        },
      },
      create: {
        reporterId: userId, targetType: input.targetType,
        targetId: input.targetId, reason: input.reason,
        details: input.details?.trim() || null,
      },
      update: {
        reason: input.reason, details: input.details?.trim() || null,
        status: PrayerReportStatus.PENDING,
        reviewedById: null, reviewedAt: null,
      },
    });
    return { id: data.id, ok: true };
  }

  async blockAuthor(userId: string, input: { requestId?: string; commentId?: string }) {
    if (!!input.requestId === !!input.commentId) {
      throw new BadRequestException('Choose a prayer request or comment.');
    }

    const target = input.requestId
      ? await this.prisma.prayerRequest.findUnique({
          where: { id: input.requestId },
          select: { createdById: true },
        })
      : await this.prisma.prayerComment.findUnique({
          where: { id: input.commentId! },
          select: { userId: true },
        });
    if (!target) throw new NotFoundException('Content unavailable');
    const blockedId = 'createdById' in target ? target.createdById : target.userId;
    if (blockedId === userId) {
      throw new BadRequestException('You cannot block yourself.');
    }

    await this.prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId } },
      create: { blockerId: userId, blockedId },
      update: {},
    });
    return { ok: true };
  }

  async listBlocks(userId: string) {
    const records = await this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true },
    });
    // Do not disclose a blocked author's name or user ID. Blocking an
    // anonymous request must not deanonymise its author through this list.
    return { data: records };
  }

  async unblock(userId: string, blockId: string) {
    const result = await this.prisma.userBlock.deleteMany({
      where: { id: blockId, blockerId: userId },
    });
    if (!result.count) throw new NotFoundException('Block not found');
    return { ok: true };
  }

  async listReports(status: PrayerReportStatus = PrayerReportStatus.PENDING) {
    const rows = await this.prisma.prayerReport.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: { reporter: { select: { displayName: true } } },
    });
    const data = await Promise.all(rows.map(async (report) => {
      const content = report.targetType === PrayerReportTarget.REQUEST
        ? await this.prisma.prayerRequest.findUnique({
            where: { id: report.targetId },
            select: { title: true, description: true, createdById: true, hidden: true },
          })
        : await this.prisma.prayerComment.findUnique({
            where: { id: report.targetId },
            select: { body: true, userId: true, hidden: true },
          });
      return { ...report, content };
    }));
    return { data };
  }

  async reviewReport(adminId: string, id: string, status: PrayerReportStatus) {
    if (status === PrayerReportStatus.PENDING) {
      throw new BadRequestException('Choose hide or dismiss.');
    }

    return this.prisma.$transaction(async (tx) => {
      const report = await tx.prayerReport.findUnique({ where: { id } });
      if (!report) throw new NotFoundException('Report not found');
      if (report.status !== PrayerReportStatus.PENDING) {
        throw new BadRequestException('This report has already been reviewed.');
      }
      if (status === PrayerReportStatus.HIDDEN) {
        if (report.targetType === PrayerReportTarget.REQUEST) {
          await tx.prayerRequest.updateMany({
            where: { id: report.targetId }, data: { hidden: true },
          });
        } else {
          await tx.prayerComment.updateMany({
            where: { id: report.targetId }, data: { hidden: true },
          });
        }
      }
      await tx.prayerReport.update({
        where: { id },
        data: { status, reviewedById: adminId, reviewedAt: new Date() },
      });
      return { ok: true };
    });
  }

  async removeComment(
    userId: string,
    id: string,
  ) {
    const comment =
      await this.prisma.prayerComment.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          userId: true,
        },
      });

    if (!comment) {
      throw new NotFoundException();
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your comment',
      );
    }

    await this.prisma.prayerComment.delete({
      where: {
        id,
      },
    });

    return {
      ok: true,
    };
  }
}