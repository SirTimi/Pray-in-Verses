// api/src/modules/identity/identity.controller.ts

import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { JwtCookieAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtCookieAuthGuard)
@Controller('identity')
export class IdentityController {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /identity/lookup?ids=a,b,c
   *
   * This endpoint is used by authenticated parts
   * of the application to resolve user IDs into
   * display names.
   */
  @Get('lookup')
  async lookup(
    @Query('ids') idsParam?: string,
  ) {
    const ids = Array.from(
      new Set(
        (idsParam ?? '')
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean),
      ),
    );

    if (ids.length === 0) {
      throw new BadRequestException(
        'ids is required',
      );
    }

    if (ids.length > 200) {
      throw new BadRequestException(
        'max 200 ids',
      );
    }

    const users =
      await this.prisma.user.findMany({
        where: {
          id: {
            in: ids,
          },
        },

        select: {
          id: true,
          displayName: true,
        },
      });

    const map: Record<
      string,
      {
        id: string;
        displayName: string;
      }
    > = {};

    for (const user of users) {
      map[user.id] = {
        id: user.id,
        displayName:
          user.displayName || '—',
      };
    }

    return {
      map,
    };
  }
}