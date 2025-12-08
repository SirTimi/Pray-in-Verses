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

  /** Normalize token: URL-decode & strip wrapping quotes if any */
  private normalize(token?: string): string | undefined {
    if (!token) return undefined;
    let v = token.trim();
    // strip optional quotes set by some proxies
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    try {
      v = decodeURIComponent(v);
    } catch {
      // ignore decode errors; use raw
    }
    return v || undefined;
  }

  /** Authorization: Bearer <token> (highest priority) */
  private extractFromAuthHeader(req: any): string | undefined {
    const hdr: string | undefined = req?.headers?.authorization;
    if (!hdr) return undefined;
    const [scheme, token] = hdr.split(' ');
    if (scheme?.toLowerCase() === 'bearer') return this.normalize(token);
    return undefined;
  }

  /** Read the LAST occurrence of access_token from raw Cookie header */
  private extractLastAccessTokenFromRawCookie(req: any): string | undefined {
    const raw: string | undefined = req?.headers?.cookie;
    if (!raw) return undefined;

    // Robust parse without breaking on dots in JWT
    // Split by ';' and keep the last pair where name === 'access_token'
    let last: string | undefined;
    for (const part of raw.split(';')) {
      const [k, ...rest] = part.split('=');
      if (!k) continue;
      if (k.trim() === 'access_token') {
        const value = rest.join('=').trim(); // preserve dots
        if (value) last = value;
      }
    }
    return this.normalize(last);
  }

  /** cookie-parser fallback (lowest priority because it may be the first/old cookie) */
  private extractFromCookieObject(req: any): string | undefined {
    const v = req?.cookies?.access_token;
    return this.normalize(typeof v === 'string' ? v : undefined);
  }

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();

    // Priority: Bearer > last cookie in raw header > cookie-parser
    let token =
      this.extractFromAuthHeader(req) ||
      this.extractLastAccessTokenFromRawCookie(req) ||
      this.extractFromCookieObject(req);

    if (!token) {
      throw new UnauthorizedException('No token');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
        // tolerate tiny clock skews from proxies/containers
        clockTolerance: 5,
      });

      // Attach rich user info for downstream use
      (req as any).user = {
        id: payload.sub,
        role: payload.role,
        email: payload.email,
        displayName: payload.displayName,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
