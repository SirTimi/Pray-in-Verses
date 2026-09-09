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
  NotificationStatus,
  Role,
  UserStatus,
} from '@prisma/client';

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { MailService } from '../mail/mail.service';

const INVITE_DAYS = 7;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // =========================================================
  // Invite helpers
  // =========================================================

  /**
   * Invite tokens are high-entropy random values.
   *
   * Only the SHA-256 hash is stored in the database.
   * The raw token exists only in the invitation URL.
   */
  private hashInviteToken(rawToken: string): string {
    return crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
  }

  // =========================================================
  // Invites
  // =========================================================

  async createInvite(
    inviterId: string,
    dto: CreateInviteDto,
  ) {
    const email = (dto.email || '')
      .trim()
      .toLowerCase();

    if (!email) {
      throw new BadRequestException(
        'Email is required',
      );
    }

    /**
     * 32 random bytes = 256 bits of entropy.
     *
     * rawToken goes into the emailed URL.
     * tokenHash goes into the database.
     */
    const rawToken =
      crypto
        .randomBytes(32)
        .toString('hex');

    const tokenHash =
      this.hashInviteToken(rawToken);

    const expiresAt =
      new Date(
        Date.now() +
          INVITE_DAYS *
            24 *
            60 *
            60 *
            1000,
      );

    const invite =
      await this.prisma.adminInvite.create({
        data: {
          email,
          role: dto.role,

          // IMPORTANT:
          // Despite the Prisma field being named `token`,
          // this now contains ONLY the SHA-256 hash.
          token: tokenHash,

          invitedBy: inviterId,
          expiresAt,
        },

        select: {
          id: true,
          email: true,
          role: true,
          expiresAt: true,
          createdAt: true,
        },
      });

    const base =
      process.env.FRONTEND_BASE_URL ||
      'http://localhost:3000';

    /**
     * Only the raw token is sent to the recipient.
     * It is never written to the database.
     */
    const link =
      `${base}/admin/accept?token=${encodeURIComponent(rawToken)}`;

    this.mailService
      .sendInvite(
        invite.email,
        link,
        invite.role,
      )
      .catch(() => undefined);

    /**
     * Do not return the raw token to the admin UI.
     *
     * The invitation is delivered through email.
     */
    return {
      data: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      },
    };
  }

  async listInvites() {
    /**
     * Explicit selection prevents the stored
     * token hash from leaking into API responses.
     */
    const rows =
      await this.prisma.adminInvite.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          invitedBy: true,
          acceptedAt: true,
          expiresAt: true,
          createdAt: true,
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    return {
      data: rows,
    };
  }

  async acceptInvite(
    dto: AcceptInviteDto,
  ) {
    const rawToken =
      (dto.token || '').trim();

    if (!rawToken) {
      throw new BadRequestException(
        'Token is required',
      );
    }

    if (
      !dto.name ||
      !dto.name.trim()
    ) {
      throw new BadRequestException(
        'Name is required',
      );
    }

    if (
      !dto.password ||
      dto.password.length < 8
    ) {
      throw new BadRequestException(
        'Password must be at least 8 characters',
      );
    }

    /**
     * Hash the incoming raw token and compare
     * only against the stored hash.
     */
    const tokenHash =
      this.hashInviteToken(rawToken);

    const invite =
      await this.prisma.adminInvite.findUnique({
        where: {
          token: tokenHash,
        },
      });

    if (!invite) {
      throw new NotFoundException(
        'Invalid invite token',
      );
    }

    if (invite.acceptedAt) {
      throw new BadRequestException(
        'Invite already accepted',
      );
    }

    if (
      invite.expiresAt <
      new Date()
    ) {
      throw new BadRequestException(
        'Invite expired',
      );
    }

    const email =
      invite.email.toLowerCase();

    const passwordHash =
      await bcrypt.hash(
        dto.password,
        12,
      );

    await this.prisma.$transaction(
      async (tx) => {
        const existing =
          await tx.user.findUnique({
            where: {
              email,
            },
          });

        if (existing) {
          const newRole =
            this.maxRole(
              existing.role,
              invite.role,
            );

          const updates: Record<
            string,
            any
          > = {};

          if (
            newRole !==
            existing.role
          ) {
            updates.role = newRole;
          }

          if (
            !existing.displayName
          ) {
            updates.displayName =
              dto.name.trim();
          }

          /**
           * Preserve existing passwords for existing
           * accounts. Accepting an admin invitation
           * should not unexpectedly replace an existing
           * user's password.
           */
          if (
            !existing.status
          ) {
            updates.status =
              UserStatus.ACTIVE;
          }

          if (
            Object.keys(updates)
              .length
          ) {
            await tx.user.update({
              where: {
                id: existing.id,
              },

              data: updates,
            });
          }
        } else {
          await tx.user.create({
            data: {
              email,
              passwordHash,
              displayName:
                dto.name.trim(),
              role: invite.role,
              status:
                UserStatus.ACTIVE,
            },
          });
        }

        /**
         * Mark this exact invitation as consumed.
         *
         * Use the invite ID rather than performing
         * another token-based update.
         */
        await tx.adminInvite.update({
          where: {
            id: invite.id,
          },

          data: {
            acceptedAt:
              new Date(),
          },
        });
      },
    );

    return {
      ok: true,
      email,
      role: invite.role,
    };
  }

  // =========================================================
  // Users
  // =========================================================

  async listUsers() {
    const users =
      await this.prisma.user.findMany({
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

        orderBy: {
          createdAt: 'desc',
        },
      });

    return {
      data: users,
    };
  }

  async updateUserRole(
    userId: string,
    dto: UpdateUserRoleDto,
  ) {
    if (!userId) {
      throw new BadRequestException(
        'User id is required',
      );
    }

    if (!dto?.role) {
      throw new BadRequestException(
        'Role is required',
      );
    }

    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    await this.prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        role: dto.role,
      },
    });

    return {
      ok: true,
    };
  }

  async suspendUser(
    userId: string,
    reason?: string,
  ) {
    if (!userId) {
      throw new BadRequestException(
        'User id is required',
      );
    }

    const user =
      await this.prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          status:
            UserStatus.SUSPENDED,
          suspendedAt:
            new Date(),
          suspendedReason:
            reason ?? null,
        },

        select: {
          id: true,
          email: true,
          displayName: true,
        },
      });

    this.mailService
      .sendSuspensionNotice(
        user.email,
        user.displayName ||
          user.email,
        reason,
      )
      .catch(() => undefined);

    return {
      ok: true,
    };
  }

  async unsuspendUser(
    userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException(
        'User id is required',
      );
    }

    const user =
      await this.prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          status:
            UserStatus.ACTIVE,
          suspendedAt: null,
          suspendedReason: null,
        },

        select: {
          id: true,
          email: true,
          displayName: true,
        },
      });

    this.mailService
      .sendUnsuspensionNotice(
        user.email,
        user.displayName ||
          user.email,
      )
      .catch(() => undefined);

    return {
      ok: true,
    };
  }

  async lookupUsersByIds(
    ids: string[],
  ) {
    const unique =
      Array.from(
        new Set(
          (ids || [])
            .map((s) =>
              (s || '').trim(),
            )
            .filter(Boolean),
        ),
      );

    if (
      unique.length === 0
    ) {
      return [];
    }

    const users =
      await this.prisma.user.findMany({
        where: {
          id: {
            in: unique,
          },
        },

        select: {
          id: true,
          displayName: true,
          email: true,
          role: true,
        },
      });

    return users.map(
      (user) => ({
        id: user.id,

        displayName:
          user.displayName ??
          user.email ??
          '—',

        email:
          user.email ?? null,

        role: user.role,
      }),
    );
  }

  // =========================================================
  // Admin Broadcast Notifications
  // =========================================================

  async broadcastNotification(
    adminId: string,
    dto: CreateNotificationDto,
  ) {
    if (!adminId) {
      throw new BadRequestException(
        'Invalid sender',
      );
    }

    const title =
      (dto.title || '').trim();

    const body =
      (dto.body || '').trim();

    if (
      !title ||
      !body
    ) {
      throw new BadRequestException(
        'title and body are required',
      );
    }

    const audience =
      dto.audience;

    if (!audience) {
      throw new BadRequestException(
        'audience is required',
      );
    }

    if (
      audience ===
      NotificationAudience.ROLE
    ) {
      if (
        !Array.isArray(
          dto.roles,
        ) ||
        dto.roles.length === 0
      ) {
        throw new BadRequestException(
          'roles is required when audience=ROLE',
        );
      }
    }

    if (
      audience ===
      NotificationAudience.USER
    ) {
      if (
        !Array.isArray(
          dto.userIds,
        ) ||
        dto.userIds.length === 0
      ) {
        throw new BadRequestException(
          'userIds is required when audience=USER',
        );
      }
    }

    // Create master notification
    const notification =
      await this.prisma.notification.create({
        data: {
          title,
          body,
          link:
            dto.link || null,
          createdById:
            adminId,
          audience,
          status:
            NotificationStatus.SENT,
        },

        select: {
          id: true,
        },
      });

    // Resolve ACTIVE recipients only.
    let recipients: {
      id: string;
      email: string | null;
      displayName:
        | string
        | null;
    }[] = [];

    if (
      audience ===
      NotificationAudience.ALL
    ) {
      recipients =
        await this.prisma.user.findMany({
          where: {
            status:
              UserStatus.ACTIVE,
          },

          select: {
            id: true,
            email: true,
            displayName: true,
          },
        });
    } else if (
      audience ===
      NotificationAudience.ROLE
    ) {
      recipients =
        await this.prisma.user.findMany({
          where: {
            status:
              UserStatus.ACTIVE,

            role: {
              in:
                dto.roles as Role[],
            },
          },

          select: {
            id: true,
            email: true,
            displayName: true,
          },
        });
    } else if (
      audience ===
      NotificationAudience.USER
    ) {
      const unique =
        Array.from(
          new Set(
            dto.userIds || [],
          ),
        );

      recipients =
        await this.prisma.user.findMany({
          where: {
            id: {
              in: unique,
            },

            status:
              UserStatus.ACTIVE,
          },

          select: {
            id: true,
            email: true,
            displayName: true,
          },
        });
    }

    if (
      recipients.length === 0
    ) {
      return {
        ok: true,
        notificationId:
          notification.id,
        deliveredTo: 0,
      };
    }

    // Create UserNotification rows in batches.
    const batchSize = 500;

    for (
      let i = 0;
      i < recipients.length;
      i += batchSize
    ) {
      const slice =
        recipients.slice(
          i,
          i + batchSize,
        );

      await this.prisma.userNotification.createMany({
        data: slice.map(
          (user) => ({
            userId: user.id,
            notificationId:
              notification.id,
            readAt: null,
          }),
        ),

        skipDuplicates: true,
      });
    }

    return {
      ok: true,
      notificationId:
        notification.id,
      deliveredTo:
        recipients.length,
    };
  }

  // =========================================================
  // Helpers
  // =========================================================

  private maxRole(
    a: Role,
    b: Role,
  ): Role {
    const order: Record<
      Role,
      number
    > = {
      USER: 0,
      EDITOR: 1,
      MODERATOR: 2,
      SUPER_ADMIN: 3,
    };

    return order[a] >=
      order[b]
      ? a
      : b;
  }
}