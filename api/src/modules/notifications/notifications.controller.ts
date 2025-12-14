// src/notifications/notifications.controller.ts
import { Controller, Get, Patch, Param, Query, UseGuards, Req, Body } from '@nestjs/common';
import type { Request } from 'express';
import { JwtCookieAuthGuard } from '../auth/jwt.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtCookieAuthGuard)
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  // Supports GET /api/notifications?limit=10
  @Get()
  async list(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    // @ts-ignore
    const userId = req.user?.id as string;
    return this.svc.listForUser(userId, limit ? Number(limit) : 50, cursor);
  }

  // Kept for backwards compatibility: GET /api/notifications/mine
  @Get('mine')
  async mine(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    // @ts-ignore
    const userId = req.user?.id as string;
    return this.svc.listForUser(userId, limit ? Number(limit) : 50, cursor);
  }

  // Preferred route: PATCH /api/notifications/:id/read
  @Patch(':id/read')
  async markRead(@Req() req: Request, @Param('id') id: string) {
    // @ts-ignore
    const userId = req.user?.id as string;
    return this.svc.markRead(userId, id);
  }

  // Legacy alias to match the current frontend call:
  // PATCH /api/notifications/read  with JSON body: { "id": "<userNotificationId>" }
  @Patch('read')
  async markReadLegacy(@Req() req: Request, @Body() body: { id?: string }) {
    // @ts-ignore
    const userId = req.user?.id as string;
    if (!body?.id) {
      // mirrors how markRead would behave if id missing
      return { ok: false, message: 'id is required' };
    }
    return this.svc.markRead(userId, body.id);
  }

  // Mark all as read: PATCH /api/notifications/read-all
  @Patch('read-all')
  async markAll(@Req() req: Request) {
    // @ts-ignore
    const userId = req.user?.id as string;
    return this.svc.markAllRead(userId);
  }
}
