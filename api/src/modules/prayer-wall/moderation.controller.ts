import { Body, Controller, Get, HttpCode, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { PrayerReportStatus, Role } from '@prisma/client';
import { JwtCookieAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ReviewPrayerReportDto } from './dto';
import { PrayerWallService } from './prayer-wall.service';
import type { Request } from 'express';

@Controller('admin/prayer-wall')
@UseGuards(JwtCookieAuthGuard, RolesGuard)
@Roles(Role.MODERATOR, Role.SUPER_ADMIN)
export class PrayerModerationController {
  constructor(private readonly service: PrayerWallService) {}

  @Get('reports')
  list(@Query('status') status?: PrayerReportStatus) {
    const selected = status === PrayerReportStatus.HIDDEN || status === PrayerReportStatus.DISMISSED
      ? status : PrayerReportStatus.PENDING;
    return this.service.listReports(selected);
  }

  @Patch('reports/:id')
  @HttpCode(200)
  review(@Req() req: Request, @Param('id') id: string, @Body() dto: ReviewPrayerReportDto) {
    return this.service.reviewReport((req as any).user.id, id, dto.status);
  }
}
