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
import { Role } from '@prisma/client';
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

  // --------------------------- Invites ---------------------------

  async createInvite(inviterId: string, dto: CreateInviteDto) {
    const email = (dto.email || '').trim().toLowerCase();
    if (!email) throw new BadRequestException('Email is required');

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(
      Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000,
    );

    const invite = await this.prisma.adminInvite.create({
      data: {
        email,
        role: dto.role,
        token,
        invitedBy: inviterId,
        expiresAt,
      },
    });

    const base = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    const link = `${base}/admin/accept?token=${encodeURIComponent(token)}`;
    // Fire-and-forget email (don’t block HTTP response)
    this.mailService
      .sendInvite(invite.email, link, invite.role)
      .catch(() => undefined);

    return {
      data: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        token,
        expiresAt,
      },
    };
  }

  async listInvites() {
    const rows = await this.prisma.adminInvite.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { data: rows };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    if (!dto.token) throw new BadRequestException('Token is required');
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Name is required');
    }
    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const invite = await this.prisma.adminInvite.findUnique({
      where: { token: dto.token },
    });
    if (!invite) throw new NotFoundException('Invalid invite token');
    if (invite.acceptedAt) throw new BadRequestException('Invite already accepted');
    if (invite.expiresAt < new Date())
      throw new BadRequestException('Invite expired');

    const email = invite.email.toLowerCase();
    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email } });

      if (existing) {
        const newRole = this.maxRole(existing.role, invite.role);
        const updates: Record<string, any> = {};
        if (newRole !== existing.role) updates.role = newRole;
        if (!existing.displayName) updates.displayName = dto.name;
        if (Object.keys(updates).length) {
          await tx.user.update({
            where: { id: existing.id },
            data: updates,
          });
        }
      } else {
        await tx.user.create({
          data: {
            email,
            passwordHash,
            displayName: dto.name,
            role: invite.role,
          },
        });
      }

      await tx.adminInvite.update({
        where: { token: invite.token },
        data: { acceptedAt: new Date() },
      });
    });

    return { ok: true, email, role: invite.role };
  }

  // --------------------------- Users -----------------------------

  async listUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true, // use displayName consistently
        role: true,
        status: true,      // requires enum in schema: ACTIVE | SUSPENDED | ...
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

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
    });
    return { ok: true };
  }

  /**
   * Suspend a user (sets status=SUSPENDED), records timestamps/reason,
   * and emails the user.
   */
  async suspendUser(userId: string, reason?: string) {
    if (!userId) throw new BadRequestException('User id is required');

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspendedReason: reason ?? null,
      },
      select: { id: true, email: true, displayName: true },
    });

    // fire-and-forget email
    this.mailService
      .sendSuspensionNotice(user.email, user.displayName || user.email, reason)
      .catch(() => undefined);

    return { ok: true };
  }

  /**
   * Unsuspend a user (sets status=ACTIVE), clears suspension fields,
   * and emails the user.
   */
  async unsuspendUser(userId: string) {
    if (!userId) throw new BadRequestException('User id is required');

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE', suspendedAt: null, suspendedReason: null },
      select: { id: true, email: true, displayName: true },
    });

    // optional notification
    this.mailService
      .sendUnsuspensionNotice(user.email, user.displayName || user.email)
      .catch(() => undefined);

    return { ok: true };
  }

  /**
   * Lightweight identity resolver for dashboard chips.
   * Returns minimal public fields (id, displayName/email fallback, email, role).
   */
  async lookupUsersByIds(ids: string[]) {
    const unique = Array.from(
      new Set((ids || []).map((s) => (s || '').trim()).filter(Boolean)),
    );
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

  // --------------------------- Helpers ---------------------------

  private maxRole(a: Role, b: Role): Role {
    const order: Record<Role, number> = {
      USER: 0,
      EDITOR: 1,
      MODERATOR: 2,
      SUPER_ADMIN: 3,
    };
    return order[a] >= order[b] ? a : b;
  }
}
