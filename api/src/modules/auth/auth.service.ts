// src/auth/auth.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import {
  ChangePasswordDto,
  LoginDto,
  SignupDto,
  UpdateProfileDto,
} from './dto';

import {
  createHash,
  randomBytes,
} from 'crypto';

import { MailService } from '../mail/mail.service';

const RESET_TTL_MINUTES = 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  private get appBase(): string {
    return (
      process.env.APP_BASE_URL ||
      'http://localhost:3000'
    );
  }

  // =========================================================
  // JWT
  // =========================================================

  private async signUserToken(
    user: {
      id: string;
      role: string;
      email: string;
      displayName:
        | string
        | null;
      authVersion: number;
    },
  ) {
    const payload = {
      sub: user.id,
      role: user.role,
      email: user.email,

      displayName:
        user.displayName ??
        undefined,

      /**
       * Session revocation version.
       */
      ver: user.authVersion,
    };

    return this.jwt.signAsync(
      payload,
      {
        secret:
          process.env
            .JWT_SECRET,

        expiresIn: '7d',
      },
    );
  }

  // =========================================================
  // Signup
  // =========================================================

  async signup(
    dto: SignupDto,
  ) {
    const email =
      dto.email
        .toLowerCase()
        .trim();

    const existing =
      await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (existing) {
      throw new BadRequestException(
        'Email already in use',
      );
    }

    const passwordHash =
      await bcrypt.hash(
        dto.password,
        12,
      );

    const user =
      await this.prisma.user.create({
        data: {
          email,
          passwordHash,

          displayName:
            dto.displayName,
        },

        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          createdAt: true,
        },
      });

    const loginLink =
      `${this.appBase}/login`;

    this.mail
      .sendInvite(
        user.email,
        loginLink,
        'USER',
      )
      .catch(
        () => undefined,
      );

    return user;
  }

  // =========================================================
  // Login
  // =========================================================

  async login(
    dto: LoginDto,
  ) {
    const email =
      dto.email
        .toLowerCase()
        .trim();

    const user =
      await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        dto.password,
        user.passwordHash,
      );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    if (
      user.status !==
      'ACTIVE'
    ) {
      throw new UnauthorizedException(
        'Account unavailable',
      );
    }

    const token =
      await this.signUserToken({
        id: user.id,
        role: user.role,
        email: user.email,

        displayName:
          user.displayName ??
          null,

        authVersion:
          user.authVersion,
      });

    const pub = {
      id: user.id,
      email: user.email,
      displayName:
        user.displayName,
      role: user.role,
    };

    return {
      token,
      user: pub,
    };
  }

  // =========================================================
  // Forgot password
  // =========================================================

  async createPasswordReset(
    emailInput: string,
  ) {
    const email =
      emailInput
        .toLowerCase()
        .trim();

    const user =
      await this.prisma.user
        .findUnique({
          where: {
            email,
          },
        })
        .catch(
          () => null,
        );

    /**
     * Prevent account enumeration.
     */
    if (!user) {
      return;
    }

    const rawToken =
      randomBytes(32)
        .toString('hex');

    const tokenHash =
      createHash('sha256')
        .update(rawToken)
        .digest('hex');

    const expiresAt =
      new Date(
        Date.now() +
          RESET_TTL_MINUTES *
            60 *
            1000,
      );

    await this.prisma
      .passwordReset
      .create({
        data: {
          userId:
            user.id,

          tokenHash,
          expiresAt,
        },
      });

    const resetUrl =
      `${this.appBase}/reset-password?token=${rawToken}`;

    this.mail
      .sendPasswordReset(
        user.email,
        resetUrl,
      )
      .catch(
        () => undefined,
      );
  }

  // =========================================================
  // Reset password
  // =========================================================

  async resetPasswordWithToken(
    rawToken: string,
    newPassword: string,
  ) {
    const tokenHash =
      createHash('sha256')
        .update(rawToken)
        .digest('hex');

    const reset =
      await this.prisma
        .passwordReset
        .findFirst({
          where: {
            tokenHash,
            usedAt: null,

            expiresAt: {
              gt: new Date(),
            },
          },

          select: {
            id: true,
            userId: true,
          },
        });

    if (!reset) {
      throw new BadRequestException(
        'Invalid or expired token.',
      );
    }

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        12,
      );

    const now =
      new Date();

    await this.prisma.$transaction(
      async (tx) => {
        /**
         * Atomically claim this reset token.
         *
         * This also protects against two requests
         * attempting to use the same token at once.
         */
        const claimed =
          await tx.passwordReset.updateMany({
            where: {
              id: reset.id,
              usedAt: null,

              expiresAt: {
                gt: now,
              },
            },

            data: {
              usedAt: now,
            },
          });

        if (
          claimed.count !== 1
        ) {
          throw new BadRequestException(
            'Invalid or expired token.',
          );
        }

        /**
         * Change password AND increment authVersion.
         *
         * Every JWT signed before this password
         * reset now has the old version number.
         */
        await tx.user.update({
          where: {
            id: reset.userId,
          },

          data: {
            passwordHash,

            authVersion: {
              increment: 1,
            },
          },
        });

        /**
         * Invalidate every other unused reset token
         * issued for this account.
         */
        await tx.passwordReset.updateMany({
          where: {
            userId:
              reset.userId,

            usedAt: null,
          },

          data: {
            usedAt: now,
          },
        });
      },
    );
  }

  // =========================================================
  // Account management
  // =========================================================

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ) {
    const displayName =
      dto.displayName.trim();

    if (
      displayName.length < 2 ||
      displayName.length > 80
    ) {
      throw new BadRequestException(
        'Display name must be between 2 and 80 characters.',
      );
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        displayName,
      },

      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          status: true,
          passwordHash: true,
          authVersion: true,
          createdAt: true,
        },
      });

    if (
      !user ||
      user.status !== 'ACTIVE'
    ) {
      throw new UnauthorizedException(
        'Account unavailable',
      );
    }

    const currentPasswordMatches =
      await bcrypt.compare(
        dto.currentPassword,
        user.passwordHash,
      );

    if (!currentPasswordMatches) {
      throw new UnauthorizedException(
        'Current password is incorrect',
      );
    }

    if (
      dto.newPassword ===
      dto.currentPassword
    ) {
      throw new BadRequestException(
        'New password must be different from your current password.',
      );
    }

    const passwordHash =
      await bcrypt.hash(
        dto.newPassword,
        12,
      );

    const now = new Date();

    const updatedUser =
      await this.prisma.$transaction(
        async (tx) => {
          const next =
            await tx.user.update({
              where: {
                id: userId,
              },

              data: {
                passwordHash,

                authVersion: {
                  increment: 1,
                },
              },

              select: {
                id: true,
                email: true,
                displayName: true,
                role: true,
                authVersion: true,
                createdAt: true,
              },
            });

          // A successful authenticated password change makes
          // any outstanding reset links obsolete.
          await tx.passwordReset.updateMany({
            where: {
              userId,
              usedAt: null,
            },

            data: {
              usedAt: now,
            },
          });

          return next;
        },
      );

    const token =
      await this.signUserToken({
        id: updatedUser.id,
        role: updatedUser.role,
        email: updatedUser.email,
        displayName:
          updatedUser.displayName,
        authVersion:
          updatedUser.authVersion,
      });

    return {
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName:
          updatedUser.displayName,
        role: updatedUser.role,
        createdAt:
          updatedUser.createdAt,
      },
    };
  }

  // =========================================================
  // Permanent account deletion
  // =========================================================

  async deleteAccount(userId: string, currentPassword: string) {
    const account = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
        passwordHash: true,
      },
    });

    if (!account || account.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account unavailable');
    }

    // Public registration only creates USER accounts. Staff accounts can
    // own shared editorial and broadcast records, so they require
    // a separate reviewed removal process instead of deleting shared work.
    if (account.role !== 'USER') {
      throw new ForbiddenException(
        'Staff accounts require administrator-assisted removal.',
      );
    }

    if (!(await bcrypt.compare(currentPassword, account.passwordHash))) {
      throw new BadRequestException('Current password is incorrect.');
    }

    await this.prisma.$transaction(
      async (tx) => {
        const current = await tx.user.findUnique({
          where: { id: userId },
          select: { role: true, status: true },
        });

        if (!current || current.role !== 'USER' || current.status !== 'ACTIVE') {
          throw new UnauthorizedException('Account unavailable');
        }

        // Do not accidentally delete a platform-wide notification if a
        // formerly privileged account was converted back to USER.
        if (await tx.notification.count({ where: { createdById: userId } })) {
          throw new ForbiddenException(
            'This account has shared administrative records requiring a reviewed removal.',
          );
        }

        // Editorial content remains public, but personal attribution
        // must not retain the deleted user's identifier.
        await tx.curatedPrayer.updateMany({
          where: { createdById: userId },
          data: { createdById: null },
        });
        await tx.curatedPrayer.updateMany({
          where: { updatedById: userId },
          data: { updatedById: null },
        });

        // Recipient targeting is stored as a scalar ID array, not an FK.
        const targeted = await tx.notification.findMany({
          where: { targetUserIds: { has: userId } },
          select: { id: true, targetUserIds: true },
        });
        for (const item of targeted) {
          await tx.notification.update({
            where: { id: item.id },
            data: {
              targetUserIds: item.targetUserIds.filter((id) => id !== userId),
            },
          });
        }

        // Remove reactions and comments made on other people's requests.
        await tx.prayerComment.deleteMany({ where: { userId } });
        await tx.prayerLike.deleteMany({ where: { userId } });
        await tx.prayerBookmark.deleteMany({ where: { userId } });

        // Remove other users' reactions/comments on the deleted user's posts
        // before deleting the posts (these relations have restrictive FKs).
        const requests = await tx.prayerRequest.findMany({
          where: { createdById: userId },
          select: { id: true },
        });
        if (requests.length) {
          const requestIds = requests.map(({ id }) => id);
          const where = { requestId: { in: requestIds } };
          await tx.prayerComment.deleteMany({ where });
          await tx.prayerLike.deleteMany({ where });
          await tx.prayerBookmark.deleteMany({ where });
          await tx.prayerRequest.deleteMany({ where: { createdById: userId } });
        }

        await tx.prayerPoint.deleteMany({ where: { userId } });
        await tx.passwordReset.deleteMany({ where: { userId } });
        await tx.savedPrayer.deleteMany({ where: { userId } });
        await tx.journal.deleteMany({ where: { userId } });
        await tx.userNotification.deleteMany({ where: { userId } });
        await tx.adminInvite.deleteMany({ where: { invitedBy: userId } });

        // Other sessions become invalid automatically because the user
        // lookup in JwtCookieAuthGuard will no longer find this account.
        await tx.user.delete({ where: { id: userId } });
      },
      { maxWait: 5000, timeout: 20000 },
    );
  }

  // =========================================================
  // Current user
  // =========================================================

  async me(
    userId: string,
  ) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
