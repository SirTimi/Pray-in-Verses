import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInviteDto, AcceptInviteDto, UpdateUserRoleDto } from './dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';

const INVITE_DAYS = 7;

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService, private mailService: MailService) {}

  // --------------------------- Invites ---------------------------

  async createInvite(inviterId: string, dto: CreateInviteDto) {
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);

    const invite = await this.prisma.adminInvite.create({
      data: {
        email: dto.email.toLowerCase(),
        role: dto.role,
        token,
        invitedBy: inviterId,
        expiresAt,
      },
    });

    const base = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    const link = `${base}/admin/accept?token=${encodeURIComponent(token)}`;
    this.mailService.sendInvite(invite.email, link, invite.role).catch(console.error);

    return { data: { id: invite.id, email: invite.email, role: invite.role, token, expiresAt } };
  }

  async listInvites() {
    const rows = await this.prisma.adminInvite.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { data: rows };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const invite = await this.prisma.adminInvite.findUnique({ where: { token: dto.token } });
    if (!invite) throw new NotFoundException('Invalid invite token');
    if (invite.acceptedAt) throw new BadRequestException('Invite already accepted');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invite expired');

    const email = invite.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      const newRole = this.maxRole(existing.role, invite.role);
      if (newRole !== existing.role) {
        await this.prisma.user.update({
          where: { id: existing.id },
          data: { role: newRole, displayName: dto.name },
        });
      } else if (!existing.displayName) {
        await this.prisma.user.update({
          where: { id: existing.id },
          data: { displayName: dto.name },
        });
      }
    } else {
      const passwordHash = await bcrypt.hash(dto.password, 10);
      await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          displayName: dto.name,
          role: invite.role,
        },
      });
    }

    await this.prisma.adminInvite.update({
      where: { token: invite.token },
      data: { acceptedAt: new Date() },
    });

    return { ok: true, email, role: invite.role };
  }

  // --------------------------- Users -----------------------------

  async listUsers() {
    const users = await this.prisma.user.findMany({
      select: { id: true, email: true, displayName: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return { data: users };
  }

  async updateUserRole(userId: string, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.update({ where: { id: userId }, data: { role: dto.role } });
    return { ok: true };
  }

  /**
   * Read-only identity resolver for Editors/Moderators/Super Admin:
   * Given a list of user IDs, returns minimal public fields used by the UI
   * to show "who worked on what" (name/email/role).
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

    // Keep the shape consistent and stable for frontend consumption
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
