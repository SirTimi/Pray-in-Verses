// apps/api/src/identity/identity.controller.ts
import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('identity')
export class IdentityController {
  constructor(private prisma: PrismaService) {}

  // GET /identity/lookup?ids=a,b,c
  @Get('lookup')
  async lookup(@Query('ids') idsParam?: string) {
    const ids = (idsParam ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (!ids.length) throw new BadRequestException('ids is required');
    if (ids.length > 200) throw new BadRequestException('max 200 ids');

    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, displayName: true, name: true },
    });

    // Build a sparse map: id -> { id, displayName }
    const map: Record<string, { id: string; displayName: string }> = {};
    for (const u of users) {
      map[u.id] = {
        id: u.id,
        displayName: u.displayName || u.name || '—',
      };
    }
    return { map };
  }
}
