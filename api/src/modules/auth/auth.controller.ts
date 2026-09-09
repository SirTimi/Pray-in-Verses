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
  ForbiddenException
} from '@nestjs/common';

import {
  Throttle,
} from '@nestjs/throttler';

import type {
  Request,
  Response,
} from 'express';

import { AuthService } from './auth.service';
import {
  SignupDto,
  LoginDto,
} from './dto';

import { JwtCookieAuthGuard } from './jwt.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

const COOKIE_NAME = 'access_token';

function cookieOptionsFromReq(
  req: Request,
) {
  const host = String(
    req.headers.host || '',
  ).toLowerCase();

  const isHttps =
    (
      req.headers[
        'x-forwarded-proto'
      ] || ''
    )
      .toString()
      .toLowerCase() === 'https' ||
    process.env.NODE_ENV ===
      'production';

  let domain:
    | string
    | undefined;

  if (
    host.endsWith(
      'prayinverses.com',
    )
  ) {
    domain =
      '.prayinverses.com';
  } else {
    domain = undefined;
  }

  const sameSite:
    | 'lax'
    | 'strict'
    | 'none' = 'lax';

  return {
    httpOnly: true,
    secure: !!isHttps,
    sameSite,
    domain,
    path: '/',
    maxAge:
      7 *
      24 *
      60 *
      60 *
      1000,
  } as const;
}

/**
 * Remove legacy cookie variants
 * that may exist from older deployments.
 */
function clearAuthCookies(
  res: Response,
) {
  const BASE = {
    httpOnly: true,
    sameSite:
      'lax' as const,
    path: '/',
  };

  // Host-only cookies
  res.clearCookie(
    COOKIE_NAME,
    {
      ...BASE,
      secure: true,
    },
  );

  res.clearCookie(
    COOKIE_NAME,
    {
      ...BASE,
      secure: false,
    },
  );

  // Explicit domains previously used
  for (const domain of [
    '.prayinverses.com',
    'prayinverses.com',
    'www.prayinverses.com',
  ]) {
    res.clearCookie(
      COOKIE_NAME,
      {
        ...BASE,
        secure: true,
        domain,
      },
    );

    res.clearCookie(
      COOKIE_NAME,
      {
        ...BASE,
        secure: false,
        domain,
      },
    );
  }
}

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
  ) {}

  // =========================================================
  // Forgot password
  // =========================================================

  /**
   * Maximum:
   * 3 password reset requests
   * from the same IP every 10 minutes.
   */
  @Throttle({
    default: {
      limit: 3,
      ttl: 10 * 60_000,
    },
  })
  @Post('forgot-password')
  async forgotPassword(
    @Body()
    dto: ForgotPasswordDto,
  ) {
    await this.auth.createPasswordReset(
      dto.email,
    );

    return {
      ok: true,
    };
  }

  // =========================================================
  // Reset password
  // =========================================================

  /**
   * Protect the reset endpoint from
   * automated repeated attempts.
   */
  @Throttle({
    default: {
      limit: 5,
      ttl: 10 * 60_000,
    },
  })
  @Post('reset-password')
  async resetPassword(
    @Body()
    dto: ResetPasswordDto,
  ) {
    await this.auth.resetPasswordWithToken(
      dto.token,
      dto.newPassword,
    );

    return {
      ok: true,
    };
  }

  // =========================================================
  // Signup
  // =========================================================

  /**
   * Prevent automated mass account creation.
   *
   * 5 signup attempts per 10 minutes
   * from a single IP.
   */
  @Throttle({
    default: {
      limit: 5,
      ttl: 10 * 60_000,
    },
  })
  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
  ) {
    return this.auth.signup(dto);
  }

  // =========================================================
  // Login
  // =========================================================

  /**
   * Brute-force protection.
   *
   * Maximum 10 login attempts per minute
   * from a single IP.
   */
  @Throttle({
    default: {
      limit: 10,
      ttl: 60_000,
    },
  })
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({
      passthrough: true,
    })
    res: Response,
  ) {
    const {
      token,
      user,
    } =
      await this.auth.login(
        dto,
      );

    // Remove old variants first
    clearAuthCookies(res);

    // Set canonical cookie
    const opts =
      cookieOptionsFromReq(
        req,
      );

    res.cookie(
      COOKIE_NAME,
      token,
      opts,
    );

    return {
      user,
    };
  }

  // =========================================================
  // Mobile login
  // =========================================================

    /**
  * Native mobile authentication.
  *
  * Unlike the web login flow, the JWT is returned
  * directly to the app so it can be stored securely
  * using Expo SecureStore.
  *
  * Mobile is currently for normal USER accounts only.
  */
  @Throttle({
    default: {
      limit: 10,
      ttl: 60_000,
    },
  })
  @HttpCode(200)
  @Post('mobile/login')
  async mobileLogin(
    @Body() dto: LoginDto,
  ) {
    const {
      token,
      user,
    } = await this.auth.login(dto);

    if (user.role !== 'USER') {
      throw new ForbiddenException(
        'This account cannot access the mobile app',
      );
    } 

    return {
      user,
      accessToken: token,
    };
  }

  // =========================================================
  // Logout
  // =========================================================

  @HttpCode(200)
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({
      passthrough: true,
    })
    res: Response,
  ) {
    clearAuthCookies(res);

    return {
      ok: true,
    };
  }

  // =========================================================
  // Current user
  // =========================================================

  @UseGuards(JwtCookieAuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    const authReq = req as Request & {
      user?: {
        id?: string;
        role?: string;
        email?: string;
        displayName?: string;
      };
    };

    const userId = authReq.user?.id;

    if (!userId) {
      return {
        status: 401,
        message: 'Unauthorized',
      };
    }

    const user = await this.auth.me(userId);

    return {
      data: user,
    };
  }
}