import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

import { PrismaService } from '../../prisma/prisma.service';

type OptionalJwtPayload = {
  sub?: string;
  role?: string;
  ver?: number;
};

@Injectable()
export class OptionalAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const bearer =
        typeof authHeader === 'string' &&
        authHeader.toLowerCase().startsWith('bearer ')
          ? authHeader.slice(7).trim()
          : '';

      const cookieToken =
        typeof (req as any).cookies?.access_token === 'string'
          ? String((req as any).cookies.access_token)
          : '';

      const token = bearer || cookieToken;
      const secret = process.env.JWT_SECRET;

      if (!token || !secret) {
        next();
        return;
      }

      const payload = await this.jwt.verifyAsync<OptionalJwtPayload>(token, {
        secret,
        clockTolerance: 5,
      });

      if (!payload.sub) {
        next();
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          role: true,
          status: true,
          email: true,
          displayName: true,
          authVersion: true,
        },
      });

      const tokenVersion =
        typeof payload.ver === 'number'
          ? payload.ver
          : 0;

      if (
        user &&
        user.status === 'ACTIVE' &&
        tokenVersion === user.authVersion
      ) {
        (req as any).user = {
          id: user.id,
          role: user.role,
          email: user.email,
          displayName: user.displayName ?? undefined,
        };
      }
    } catch {
      // Public read endpoints stay available when no valid session exists.
    }

    next();
  }
}
