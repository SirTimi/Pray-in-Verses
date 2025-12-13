// src/notifications/notifications.controller.ts
import { Controller, Get, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { JwtCookieAuthGuard } from '../auth/jwt.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtCookieAuthGuard)
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  @Get('mine')
  async mine(@Req() req: Request, @Query('limit') limit?: string, @Query('cursor') cursor?: string) {
    // @ts-ignore
    const userId = req.user?.id as string;
    return this.svc.listForUser(userId, limit ? Number(limit) : 50, cursor);
  }

  @Patch(':id/read')
  async markRead(@Req() req: Request, @Param('id') id: string) {
    // @ts-ignore
    const userId = req.user?.id as string;
    return this.svc.markRead(userId, id);
  }

  @Patch('read-all')
  async markAll(@Req() req: Request) {
    // @ts-ignore
    const userId = req.user?.id as string;
    return this.svc.markAllRead(userId);
  }
}
