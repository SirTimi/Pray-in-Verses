// src/admin/admin.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateInviteDto,
  AcceptInviteDto,
  UpdateUserRoleDto,
} from './dto';
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto';
import {
  NotificationAudience,
  Role,
  UserStatus,
  Prisma,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';

const INVITE_DAYS = 7;

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async createInvite(inviterId: string, dto: CreateInviteDto) {
    const email = (dto.email || '').trim().toLowerCase();
    if (!email) throw new BadRequestException('Email is required');

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);

    const invite = await this.prisma.adminInvite.create({
      data: { email, role: dto.role, token, invitedBy: inviterId, expiresAt },
    });

    const base = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    const link = `${base}/admin/accept?token=${encodeURIComponent(token)}`;

    this.mailService.sendInvite(invite.email, link, invite.role).catch(() => undefined);

    return { data: { id: invite.id, email: invite.email, role: invite.role, token, expiresAt } };
  }

  async listInvites() {
    const rows = await this.prisma.adminInvite.findMany({ orderBy: { createdAt: 'desc' } });
    return { data: rows };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    if (!dto.token) throw new BadRequestException('Token is required');
    if (!dto.name?.trim()) throw new BadRequestException('Name is required');
    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const invite = await this.prisma.adminInvite.findUnique({ where: { token: dto.token } });
    if (!invite) throw new NotFoundException('Invalid invite token');
    if (invite.acceptedAt) throw new BadRequestException('Invite already accepted');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invite expired');

    const email = invite.email.toLowerCase();
    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email } });

      if (existing) {
        const newRole = this.maxRole(existing.role, invite.role);
        const updates: Record<string, any> = {};
        if (newRole !== existing.role) updates.role = newRole;
        if (!existing.displayName) updates.displayName = dto.name;
        if ((existing as any).status == null) updates.status = UserStatus.ACTIVE;

        if (Object.keys(updates).length) {
          await tx.user.update({ where: { id: existing.id }, data: updates });
        }
      } else {
        await tx.user.create({
          data: {
            email,
            passwordHash,
            displayName: dto.name,
            role: invite.role,
            status: UserStatus.ACTIVE,
          },
        });
      }

      await tx.adminInvite.update({ where: { token: invite.token }, data: { acceptedAt: new Date() } });
    });

    return { ok: true, email, role: invite.role };
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        suspendedAt: true,
        suspendedReason: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data: users };
  }

  async updateUserRole(userId: string, dto: UpdateUserRoleDto) {
    if (!userId) throw new BadRequestException('User id is required');
    if (!dto?.role) throw new BadRequestException('Role is required');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({ where: { id: userId }, data: { role: dto.role } });
    return { ok: true };
  }

  async suspendUser(userId: string, reason?: string) {
    if (!userId) throw new BadRequestException('User id is required');

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.SUSPENDED, suspendedAt: new Date(), suspendedReason: reason ?? null },
      select: { id: true, email: true, displayName: true },
    });

    this.mailService
      .sendSuspensionNotice(user.email, user.displayName || user.email, reason)
      .catch(() => undefined);

    return { ok: true };
  }

  async unsuspendUser(userId: string) {
    if (!userId) throw new BadRequestException('User id is required');

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE, suspendedAt: null, suspendedReason: null },
      select: { id: true, email: true, displayName: true },
    });

    this.mailService.sendUnsuspensionNotice(user.email, user.displayName || user.email).catch(() => undefined);

    return { ok: true };
  }

  async lookupUsersByIds(ids: string[]) {
    const unique = Array.from(new Set((ids || []).map((s) => (s || '').trim()).filter(Boolean)));
    if (unique.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: unique } },
      select: { id: true, displayName: true, email: true, role: true },
    });

    return users.map((u) => ({
      id: u.id,
      displayName: u.displayName ?? u.email ?? '—',
      email: u.email ?? null,
      role: u.role,
    }));
  }

  // -------------------- Admin Broadcast Notifications --------------------

  async broadcastNotification(adminId: string, dto: CreateNotificationDto) {
    if (!adminId) throw new BadRequestException('Invalid sender');

    const title = (dto.title || '').trim();
    const body = (dto.body || '').trim();
    if (!title || !body) throw new BadRequestException('title and body are required');

    const audience = dto.audience;
    if (!audience) throw new BadRequestException('audience is required');

    if (audience === NotificationAudience.ROLE) {
      if (!Array.isArray(dto.roles) || dto.roles.length === 0) {
        throw new BadRequestException('roles is required when audience=ROLE');
      }
    }
    if (audience === NotificationAudience.USER) {
      if (!Array.isArray(dto.userIds) || dto.userIds.length === 0) {
        throw new BadRequestException('userIds is required when audience=USER');
      }
    }

    try {
      const notification = await this.prisma.notification.create({
        data: {
          title,
          body,
          link: dto.link || null,
          createdById: adminId,
          audience,
        },
        select: { id: true },
      });

      let recipients: { id: string }[] = [];

      if (audience === NotificationAudience.ALL) {
        recipients = await this.prisma.user.findMany({
          where: { OR: [{ status: UserStatus.ACTIVE }, { status: null as any }] },
          select: { id: true },
        });
      } else if (audience === NotificationAudience.ROLE) {
        recipients = await this.prisma.user.findMany({
          where: {
            role: { in: dto.roles as Role[] },
            OR: [{ status: UserStatus.ACTIVE }, { status: null as any }],
          },
          select: { id: true },
        });
      } else if (audience === NotificationAudience.USER) {
        const unique = Array.from(new Set(dto.userIds || []));
        recipients = await this.prisma.user.findMany({
          where: { id: { in: unique }, OR: [{ status: UserStatus.ACTIVE }, { status: null as any }] },
          select: { id: true },
        });
      }

      if (recipients.length === 0) {
        return { ok: true, notificationId: notification.id, deliveredTo: 0 };
      }

      const batchSize = 500;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const slice = recipients.slice(i, i + batchSize);
        await this.prisma.userNotification.createMany({
          data: slice.map((u) => ({ userId: u.id, notificationId: notification.id, readAt: null })),
          skipDuplicates: true,
        });
      }

      return { ok: true, notificationId: notification.id, deliveredTo: recipients.length };
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // Surface common Prisma issues clearly
        if (e.code === 'P2021') {
          // table/view does not exist
          throw new BadRequestException(
            'Database is missing notification tables. Run migrations (Notification, UserNotification, User.status).',
          );
        }
        if (e.code === 'P2003') {
          // FK constraint
          throw new BadRequestException('Invalid foreign key (userId/notificationId). Check schema & migrations.');
        }
        throw new BadRequestException(`${e.code}: ${e.meta ? JSON.stringify(e.meta) : e.message}`);
      }
      throw e;
    }
  }

  // --------------------------- Helpers ---------------------------

  private maxRole(a: Role, b: Role): Role {
    const order: Record<Role, number> = { USER: 0, EDITOR: 1, MODERATOR: 2, SUPER_ADMIN: 3 };
    return order[a] >= order[b] ? a : b;
  }
}
