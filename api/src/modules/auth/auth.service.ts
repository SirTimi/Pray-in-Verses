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
import { createHash, randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';

const RESET_TTL_MINUTES = 60;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
  ) {}

  /** Resolve app base URL once */
  private get appBase(): string {
    return process.env.APP_BASE_URL || 'http://localhost:3000';
  }

  /** Issue a signed JWT with a stable payload shape */
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
      displayName: user.displayName ?? undefined,
    };
    return this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d',
    });
  }

  async signup(dto: SignupDto) {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, displayName: dto.displayName },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
      },
    });

    // Soft-send a welcome email. Uses MailService SMTP/SendGrid fallback logic.
    // If you prefer not to send on signup, remove this block.
    const loginLink = `${this.appBase}/login`;
    this.mail
      .sendInvite(user.email, loginLink, 'USER') // reuses the clean template
      .catch(() => undefined);

    return user;
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const token = await this.signUserToken({
      id: user.id,
      role: user.role,
      email: user.email,
      displayName: user.displayName ?? null,
    });

    const pub = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };

    return { token, user: pub };
  }

  async createPasswordReset(emailInput: string) {
    const email = emailInput.toLowerCase().trim();

    const user = await this.prisma.user
      .findUnique({ where: { email } })
      .catch(() => null);

    // Silent success to avoid user enumeration
    if (!user) return;

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

    await this.prisma.passwordReset.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetUrl = `${this.appBase}/reset-password?token=${rawToken}`;

    // Soft-fail email send so the API response is stable
    this.mail.sendPasswordReset(user.email, resetUrl).catch(() => undefined);
  }

  async resetPasswordWithToken(rawToken: string, newPassword: string) {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const reset = await this.prisma.passwordReset.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    if (!reset) {
      throw new BadRequestException('Invalid or expired token.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  async me(userId: string) {
    // Always fetch fresh so role/name changes reflect quickly
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
