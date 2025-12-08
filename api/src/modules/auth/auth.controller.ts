// src/auth/auth.controller.ts
import {
  Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto } from './dto';
import { JwtCookieAuthGuard } from './jwt.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

const COOKIE_NAME = 'access_token';

function cookieOptionsFromReq(req: Request) {
  const host = String(req.headers.host || '').toLowerCase();
  const isHttps =
    (req.headers['x-forwarded-proto'] || '').toString().toLowerCase() === 'https' ||
    process.env.NODE_ENV === 'production';

  let domain: string | undefined;
  if (host.endsWith('prayinverses.com')) {
    domain = '.prayinverses.com'; // cover apex + subdomains
  } else {
    domain = undefined; // localhost/dev
  }

  const sameSite: 'lax' | 'strict' | 'none' = 'lax';

  return {
    httpOnly: true,
    secure: !!isHttps,
    sameSite,
    domain,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  } as const;
}

/** Aggressively remove any legacy cookie variants that might still exist. */
function clearAuthCookies(res: Response) {
  const BASE = { httpOnly: true, sameSite: 'lax' as const, path: '/' };

  // host-only (no domain attr)
  res.clearCookie(COOKIE_NAME, { ...BASE, secure: true });
  res.clearCookie(COOKIE_NAME, { ...BASE, secure: false });

  // explicit domains we may have used before
  for (const d of ['.prayinverses.com', 'prayinverses.com', 'www.prayinverses.com']) {
    res.clearCookie(COOKIE_NAME, { ...BASE, secure: true, domain: d });
    res.clearCookie(COOKIE_NAME, { ...BASE, secure: false, domain: d });
  }
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.createPasswordReset(dto.email);
    return { ok: true };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPasswordWithToken(dto.token, dto.newPassword);
    return { ok: true };
  }

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, user } = await this.auth.login(dto);

    // 1) nuke all legacy cookies to avoid duplicates
    clearAuthCookies(res);

    // 2) set the canonical cookie with stable attributes
    const opts = cookieOptionsFromReq(req);
    res.cookie(COOKIE_NAME, token, opts);

    return { user };
  }

  @HttpCode(200)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Clear everything aggressively
    clearAuthCookies(res);
    return { ok: true };
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    // @ts-ignore – JwtCookieAuthGuard sets req.user
    const { id } = req.user || {};
    if (!id) return { status: 401, message: 'Unauthorized' };
    const user = await this.auth.me(id);
    return { data: user };
  }
}
