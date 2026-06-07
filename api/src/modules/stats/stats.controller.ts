import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtCookieAuthGuard } from '../auth/jwt.guard';
import { PublishState } from '@prisma/client';

@UseGuards(JwtCookieAuthGuard) // keep consistent with the rest of the app
@Controller('stats')
export class StatsController {
  constructor(private prisma: PrismaService) {}

  @Get('users-count')
  async usersCount() {
    const count = await this.prisma.user.count();
    return { count };
  }

  /**
   * Curated prayer counts grouped by publish state.
   * One round-trip, one indexed GROUP BY — replaces the old
   * paginate-everything approach on the dashboard.
   */
  @Get('curated-counts')
  async curatedCounts() {
    const grouped = await this.prisma.curatedPrayer.groupBy({
      by: ['state'],
      _count: { _all: true },
    });

    // Start every known state at 0 so the client always gets a full set.
    const counts: Record<PublishState, number> = {
      DRAFT: 0,
      REVIEW: 0,
      PUBLISHED: 0,
      ARCHIVED: 0,
    };

    for (const g of grouped) {
      counts[g.state] = g._count._all;
    }

    const total =
      counts.DRAFT + counts.REVIEW + counts.PUBLISHED + counts.ARCHIVED;

    return { counts, total };
  }
}