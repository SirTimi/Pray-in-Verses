// src/notifications/notifications.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationAudience, Role } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createAndFanout(adminId: string, dto: CreateNotificationDto) {
    // Validate targeting
    if (dto.audience === 'ROLE' && (!dto.roles || dto.roles.length === 0)) {
      throw new BadRequestException('roles is required when audience=ROLE');
    }
    if (dto.audience === 'USER' && (!dto.userIds || dto.userIds.length === 0)) {
      throw new BadRequestException('userIds is required when audience=USER');
    }

    // Create the master notification
    const notif = await this.prisma.notification.create({
      data: {
        title: dto.title,
        body: dto.body,
        link: dto.link,
        audience: dto.audience as NotificationAudience,
        roles: (dto.roles || []) as Role[],
        targetUserIds: dto.userIds || [],
        createdById: adminId,
      },
    });

    // Resolve recipients
    let recipients: { id: string }[] = [];
    if (dto.audience === 'ALL') {
      recipients = await this.prisma.user.findMany({
        where: { status: 'ACTIVE' }, // respect suspension
        select: { id: true },
      });
    } else if (dto.audience === 'ROLE') {
      recipients = await this.prisma.user.findMany({
        where: { status: 'ACTIVE', role: { in: dto.roles! } },
        select: { id: true },
      });
    } else {
      recipients = await this.prisma.user.findMany({
        where: { status: 'ACTIVE', id: { in: dto.userIds! } },
        select: { id: true },
      });
    }

    if (recipients.length === 0) {
      return { ok: true, notificationId: notif.id, delivered: 0 };
    }

    // Fan-out: create UserNotification rows (batched)
    // For very large user counts, switch to a background job (BullMQ) – this works fine up to tens of thousands.
    const chunks: { userId: string; notificationId: string }[][] = [];
    const BATCH = 1000;
    for (let i = 0; i < recipients.length; i += BATCH) {
      chunks.push(recipients.slice(i, i + BATCH).map(r => ({
        userId: r.id,
        notificationId: notif.id,
      })));
    }

    for (const batch of chunks) {
      await this.prisma.userNotification.createMany({ data: batch, skipDuplicates: true });
    }

    return { ok: true, notificationId: notif.id, delivered: recipients.length };
  }

  async listForUser(userId: string, limit = 50, cursor?: string) {
    const rows = await this.prisma.userNotification.findMany({
      where: { userId },
      include: { notification: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return { data: rows };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.userNotification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.userNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }
}
