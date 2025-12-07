// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto } from './dto';
import { JwtCookieAuthGuard } from './jwt.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

const COOKIE_NAME = 'access_token';

// Compute robust cookie settings from the incoming request.
// Ensures we don't accidentally set multiple variant cookies (e.g., different domain/samesite/secure).
function cookieOptionsFromReq(req: Request) {
  const host = String(req.headers.host || '').toLowerCase();
  const isHttps =
    // if there's a trusted proxy, this is the reliable signal
    (req.headers['x-forwarded-proto'] || '').toString().toLowerCase() === 'https' ||
    // fallback: production should always be https behind nginx
    process.env.NODE_ENV === 'production';

  // Domain: pin to apex so both www and bare domain share the cookie.
  // If you serve only one hostname, you can omit domain to let the browser default.
  let domain: string | undefined;
  if (host.endsWith('prayinverses.com')) {
    domain = '.prayinverses.com'; // covers prayinverses.com and www.prayinverses.com
  } else {
    domain = undefined; // localhost/dev → no domain attribute
  }

  // SameSite:
  // - 'lax' is ideal for same-site (the admin lives on same origin). If you ever embed the app
  //   in a cross-site context, switch to 'none' + secure.
  const sameSite: 'lax' | 'strict' | 'none' = domain ? 'lax' : 'lax';

  return {
    httpOnly: true,
    secure: !!isHttps,
    sameSite,
    domain,
    path: '/', // critical to avoid variants on different paths
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  } as const;
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
    // NOTE: auth.login() should now sign email/displayName into the JWT payload:
    // payload = { sub: user.id, role: user.role, email: user.email, displayName: user.displayName }
    // (See the updated auth.service.ts I provided earlier.)
    const { token, user } = await this.auth.login(dto);

    const opts = cookieOptionsFromReq(req);
    // Overwrite any prior cookie by setting the same name+path+domain
    res.cookie(COOKIE_NAME, token, opts);

    return { user };
  }

  @HttpCode(200)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const opts = cookieOptionsFromReq(req);
    // Clear with identical attributes so the browser actually removes the same cookie
    res.clearCookie(COOKIE_NAME, {
      path: opts.path,
      domain: opts.domain,
      sameSite: opts.sameSite,
      secure: opts.secure,
    });
    return { ok: true };
  }

  @UseGuards(JwtCookieAuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    // jwt.guard attaches req.user = { id, role, email?, displayName? }
    // @ts-ignore
    const { id } = req.user || {};
    // Graceful failure instead of 500 if something is off
    if (!id) {
      return { status: 401, message: 'Unauthorized' };
    }
    const user = await this.auth.me(id);
    return { user };
  }
}
