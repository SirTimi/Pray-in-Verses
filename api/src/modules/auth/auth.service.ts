// src/auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SignupDto, LoginDto } from './dto';
import {
  createHash,
  randomBytes,
} from 'crypto';
import { MailService } from '../mail/mail.service';

const RESET_TTL_MINUTES = 60;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
  ) {}

  /**
   * Resolve application base URL.
   */
  private get appBase(): string {
    return (
      process.env.APP_BASE_URL ||
      'http://localhost:3000'
    );
  }

  /**
   * Issue signed JWT.
   */
  private async signUserToken(user: {
    id: string;
    role: string;
    email: string;
    displayName: string | null;
  }) {
    const payload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      displayName:
        user.displayName ?? undefined,
    };

    return this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d',
    });
  }

  // =========================================================
  // Signup
  // =========================================================

  async signup(dto: SignupDto) {
    const email =
      dto.email.toLowerCase().trim();

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

    // Soft-send welcome email.
    const loginLink =
      `${this.appBase}/login`;

    this.mail
      .sendInvite(
        user.email,
        loginLink,
        'USER',
      )
      .catch(() => undefined);

    return user;
  }

  // =========================================================
  // Login
  // =========================================================

  async login(dto: LoginDto) {
    const email =
      dto.email.toLowerCase().trim();

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

    /**
     * IMPORTANT:
     * A suspended account must not be allowed
     * to receive a new authentication token.
     */
    if (user.status !== 'ACTIVE') {
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
          user.displayName ?? null,
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
  // Password reset request
  // =========================================================

  async createPasswordReset(
    emailInput: string,
  ) {
    const email =
      emailInput.toLowerCase().trim();

    const user =
      await this.prisma.user
        .findUnique({
          where: {
            email,
          },
        })
        .catch(() => null);

    /**
     * Silent success prevents attackers
     * from discovering which emails have
     * Pray in Verses accounts.
     */
    if (!user) {
      return;
    }

    const rawToken =
      randomBytes(32).toString('hex');

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

    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const resetUrl =
      `${this.appBase}/reset-password?token=${rawToken}`;

    // Soft-fail email sending.
    this.mail
      .sendPasswordReset(
        user.email,
        resetUrl,
      )
      .catch(() => undefined);
  }

  // =========================================================
  // Password reset
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
      await this.prisma.passwordReset.findFirst({
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },

        include: {
          user: true,
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

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: reset.userId,
        },

        data: {
          passwordHash,
        },
      }),

      this.prisma.passwordReset.update({
        where: {
          id: reset.id,
        },

        data: {
          usedAt:
            new Date(),
        },
      }),
    ]);
  }

  // =========================================================
  // Current user
  // =========================================================

  async me(userId: string) {
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
          createdAt: true,
        },
      });

    return user;
  }
}