// src/auth/jwt.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

type JwtPayload = {
  sub: string;
  role: string;
  email?: string;
  displayName?: string;
  iat?: number;
  exp?: number;
};

@Injectable()
export class JwtCookieAuthGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  private extractFromCookieObject(req: any): string | undefined {
    // If cookie-parser populated req.cookies, use it first.
    const v = req?.cookies?.access_token;
    if (typeof v === 'string' && v.trim()) return v.trim();
    return undefined;
  }

  private extractLastAccessTokenFromHeader(req: any): string | undefined {
    // Handle multiple access_token entries in raw Cookie header.
    const raw: string | undefined = req?.headers?.cookie;
    if (!raw) return undefined;

    // Split on ';' and parse pairs; keep the LAST access_token seen.
    let last: string | undefined;
    for (const part of raw.split(';')) {
      const [k, ...rest] = part.split('=');
      if (!k) continue;
      const key = k.trim();
      if (key === 'access_token') {
        const value = rest.join('=').trim(); // preserve dots in JWT
        if (value) last = value;
      }
    }
    return last;
  }

  private extractFromAuthHeader(req: any): string | undefined {
    const hdr: string | undefined = req?.headers?.authorization;
    if (!hdr) return undefined;
    const [scheme, token] = hdr.split(' ');
    if (scheme?.toLowerCase() === 'bearer' && token?.trim()) return token.trim();
    return undefined;
  }

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();

    // 1) Try parsed cookies
    let token = this.extractFromCookieObject(req);

    // 2) If missing or empty, read the LAST occurrence from raw Cookie header
    if (!token) token = this.extractLastAccessTokenFromHeader(req);

    // 3) Fall back to Authorization: Bearer
    if (!token) token = this.extractFromAuthHeader(req);

    if (!token) {
      throw new UnauthorizedException('No token');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      // Attach rich user info so controllers/services can rely on it
      (req as any).user = {
        id: payload.sub,
        role: payload.role,
        email: payload.email,
        displayName: payload.displayName,
      };

      return true;
    } catch {
      // Token present but invalid/expired
      throw new UnauthorizedException('Invalid token');
    }
  }
}
