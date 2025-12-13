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
  constructor(private readonly jwt: JwtService) {}

  /** Normalize token: URL-decode & strip wrapping quotes if any */
  private normalize(token?: string): string | undefined {
    if (!token) return undefined;
    let v = String(token).trim();
    // strip optional quotes some proxies add
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    try {
      v = decodeURIComponent(v);
    } catch {
      /* ignore decode errors; use raw */
    }
    return v || undefined;
  }

  /** Authorization: Bearer <token> */
  private fromAuthHeader(req: any): string | undefined {
    const hdr: string | undefined = req?.headers?.authorization;
    if (!hdr) return undefined;
    const [scheme, token] = hdr.split(' ');
    if (scheme?.toLowerCase() === 'bearer') return this.normalize(token);
    return undefined;
  }

  /** Custom headers (useful for mobile/edge proxies) */
  private fromCustomHeader(req: any): string | undefined {
    return (
      this.normalize(req?.headers?.['x-access-token']) ||
      this.normalize(req?.headers?.['x-jwt']) ||
      this.normalize(req?.headers?.['x-auth-token'])
    );
  }

  /** Read the LAST occurrence of access_token from raw Cookie header (handles multiple set-cookies) */
  private fromRawCookie(req: any): string | undefined {
    const raw: string | undefined = req?.headers?.cookie;
    if (!raw) return undefined;

    let last: string | undefined;
    for (const part of raw.split(';')) {
      const [k, ...rest] = part.split('=');
      if (!k) continue;
      if (k.trim() === 'access_token') {
        const value = rest.join('=').trim(); // keep dots in JWT
        if (value) last = value;
      }
    }
    return this.normalize(last);
  }

  /** cookie-parser fallback */
  private fromCookieObj(req: any): string | undefined {
    const v = req?.cookies?.access_token;
    return this.normalize(typeof v === 'string' ? v : undefined);
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();

    // Priority: Bearer > custom headers > last raw cookie > cookie-parser
    const token =
      this.fromAuthHeader(req) ||
      this.fromCustomHeader(req) ||
      this.fromRawCookie(req) ||
      this.fromCookieObj(req);

    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // Make misconfig obvious rather than returning 401
      throw new Error('JWT_SECRET is not configured');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret,
        clockTolerance: 5, // tolerate tiny clock skews
      });

      // Attach rich user info downstream
      (req as any).user = {
        id: payload.sub,
        role: payload.role,
        email: payload.email,
        displayName: payload.displayName,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
