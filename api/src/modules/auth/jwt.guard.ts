// src/auth/jwt.guard.ts

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

type JwtPayload = {
  sub: string;
  role: string;
  email?: string;
  displayName?: string;

  /**
   * Authentication/session version.
   *
   * Old tokens created before this feature
   * will not contain `ver`. They are treated
   * as version 0 for backwards compatibility.
   */
  ver?: number;

  iat?: number;
  exp?: number;
};

@Injectable()
export class JwtCookieAuthGuard
  implements CanActivate
{
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Normalize token:
   * URL decode and strip wrapping quotes.
   */
  private normalize(
    token?: string,
  ): string | undefined {
    if (!token) {
      return undefined;
    }

    let value =
      String(token).trim();

    if (
      (
        value.startsWith('"') &&
        value.endsWith('"')
      ) ||
      (
        value.startsWith("'") &&
        value.endsWith("'")
      )
    ) {
      value =
        value.slice(1, -1);
    }

    try {
      value =
        decodeURIComponent(value);
    } catch {
      // Keep raw value if decoding fails.
    }

    return value || undefined;
  }

  /**
   * Authorization: Bearer <token>
   */
  private fromAuthHeader(
    req: any,
  ): string | undefined {
    const header:
      | string
      | undefined =
      req?.headers?.authorization;

    if (!header) {
      return undefined;
    }

    const [
      scheme,
      token,
    ] =
      header.split(' ');

    if (
      scheme?.toLowerCase() ===
      'bearer'
    ) {
      return this.normalize(
        token,
      );
    }

    return undefined;
  }

  /**
   * Useful for mobile clients / proxies.
   */
  private fromCustomHeader(
    req: any,
  ): string | undefined {
    return (
      this.normalize(
        req?.headers?.[
          'x-access-token'
        ],
      ) ||
      this.normalize(
        req?.headers?.['x-jwt'],
      ) ||
      this.normalize(
        req?.headers?.[
          'x-auth-token'
        ],
      )
    );
  }

  /**
   * Read the LAST access_token occurrence
   * from the raw Cookie header.
   */
  private fromRawCookie(
    req: any,
  ): string | undefined {
    const raw:
      | string
      | undefined =
      req?.headers?.cookie;

    if (!raw) {
      return undefined;
    }

    let last:
      | string
      | undefined;

    for (
      const part of
      raw.split(';')
    ) {
      const [
        key,
        ...rest
      ] =
        part.split('=');

      if (!key) {
        continue;
      }

      if (
        key.trim() ===
        'access_token'
      ) {
        const value =
          rest
            .join('=')
            .trim();

        if (value) {
          last = value;
        }
      }
    }

    return this.normalize(
      last,
    );
  }

  /**
   * cookie-parser fallback.
   */
  private fromCookieObj(
    req: any,
  ): string | undefined {
    const value =
      req?.cookies
        ?.access_token;

    return this.normalize(
      typeof value === 'string'
        ? value
        : undefined,
    );
  }

  async canActivate(
    ctx: ExecutionContext,
  ): Promise<boolean> {
    const req =
      ctx
        .switchToHttp()
        .getRequest();

    // Priority:
    // Bearer → custom header → raw cookie → parsed cookie
    const token =
      this.fromAuthHeader(req) ||
      this.fromCustomHeader(req) ||
      this.fromRawCookie(req) ||
      this.fromCookieObj(req);

    if (!token) {
      throw new UnauthorizedException(
        'Missing token',
      );
    }

    const secret =
      process.env.JWT_SECRET;

    if (!secret) {
      throw new Error(
        'JWT_SECRET is not configured',
      );
    }

    let payload: JwtPayload;

    try {
      payload =
        await this.jwt.verifyAsync<JwtPayload>(
          token,
          {
            secret,
            clockTolerance: 5,
          },
        );
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired token',
      );
    }

    if (!payload?.sub) {
      throw new UnauthorizedException(
        'Invalid token payload',
      );
    }

    const user =
      await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },

        select: {
          id: true,
          role: true,
          status: true,
          email: true,
          displayName: true,
          authVersion: true,
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

    /**
     * Tokens created before authVersion existed
     * have no `ver`.
     *
     * Treat those as version 0.
     *
     * This means existing users are NOT logged
     * out simply because this feature is deployed.
     */
    const tokenVersion =
      typeof payload.ver ===
      'number'
        ? payload.ver
        : 0;

    if (
      tokenVersion !==
      user.authVersion
    ) {
      throw new UnauthorizedException(
        'Session expired',
      );
    }

    (req as any).user = {
      id: user.id,
      role: user.role,
      email: user.email,
      displayName:
        user.displayName ??
        undefined,
    };

    return true;
  }
}