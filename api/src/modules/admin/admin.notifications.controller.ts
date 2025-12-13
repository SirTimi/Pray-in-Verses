// src/admin/admin.notifications.controller.ts
import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { JwtCookieAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto';

@Controller('admin/notifications')
@UseGuards(JwtCookieAuthGuard, RolesGuard)
export class AdminNotificationsController {
  constructor(private svc: NotificationsService) {}

  @Roles(Role.SUPER_ADMIN, Role.MODERATOR, Role.EDITOR)
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateNotificationDto) {
    // @ts-ignore
    const adminId = req.user?.id as string;
    return this.svc.createAndFanout(adminId, dto);
  }
}
