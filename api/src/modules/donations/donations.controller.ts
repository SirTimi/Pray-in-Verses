import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Prisma } from '@prisma/client'
import {
  SkipThrottle,
  Throttle,
} from '@nestjs/throttler';

import type {
  Request,
  Response,
} from 'express';

import { DonationsService } from './donations.service';

type InitBody = {
  email: string;
  amount: number;
  name?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  callbackPath?: string;
  redirectUrl?: string;
};

@Controller('donations')
export class DonationsController {
  constructor(
    private readonly svc: DonationsService,
  ) {}

  /**
   * Only permit donation redirects back to
   * Pray in Verses.
   *
   * This prevents the Paystack callback from
   * being turned into an arbitrary external
   * redirect.
   */
  private normalizeRedirect(
    value?: string,
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    const baseString =
      (
        process.env.APP_BASE_URL ||
        'https://prayinverses.com'
      ).replace(/\/+$/, '');

    const base =
      new URL(baseString);

    let target: URL;

    try {
      target =
        new URL(value, base);
    } catch {
      throw new BadRequestException(
        'Invalid redirect URL',
      );
    }

    if (
      target.origin !==
      base.origin
    ) {
      throw new BadRequestException(
        'Invalid redirect URL',
      );
    }

    return target.toString();
  }

  /**
   * POST /api/donations/initialize
   */
  @Throttle({
    default: {
      limit: 10,
      ttl: 60_000,
    },
  })
  @HttpCode(200)
  @Post('initialize')
  async initialize(
    @Req() req: Request,
    @Body() body: InitBody,
  ) {
    const email =
      String(
        body.email || '',
      )
        .trim()
        .toLowerCase();

    const amountNaira =
      Number(
        body.amount || 0,
      );

    if (
      !email ||
      !/\S+@\S+\.\S+/.test(
        email,
      )
    ) {
      throw new BadRequestException(
        'Invalid email',
      );
    }

    if (
      !Number.isFinite(
        amountNaira,
      ) ||
      amountNaira < 100
    ) {
      throw new BadRequestException(
        'Amount must be at least ₦100',
      );
    }

    const appBase =
      (
        process.env.APP_BASE_URL ||
        'https://prayinverses.com'
      ).replace(/\/+$/, '');

    /**
     * redirectUrl takes priority for
     * backwards compatibility.
     *
     * But it MUST resolve to the same origin
     * as APP_BASE_URL.
     */
    const callbackUrl =
      this.normalizeRedirect(
        body.redirectUrl,
      ) ||
      this.normalizeRedirect(
        body.callbackPath,
      ) ||
      `${appBase}/donations/thank-you`;

    /**
     * Keep client-controlled metadata separated
     * from server-controlled metadata.
     */
    const clientMetadata: Prisma.InputJsonObject =
      body.metadata &&
      typeof body.metadata === 'object' &&
      !Array.isArray(body.metadata)
        ? JSON.parse(
            JSON.stringify(body.metadata),
          )
        : {};

    const forwardedFor =
      req.headers[
        'x-forwarded-for'
      ];

    const ip =
      typeof forwardedFor ===
      'string'
        ? forwardedFor
            .split(',')[0]
            ?.trim()
        : req.socket
            .remoteAddress;

    const name =
      String(
        body.name || '',
      )
        .trim()
        .slice(0, 150);

    const message =
      String(
        body.message || '',
      )
        .trim()
        .slice(0, 2000);

    const metadata = {
      clientMetadata,

      ...(name
        ? { name }
        : {}),

      ...(message
        ? { message }
        : {}),

      source: 'web',

      ...(req.headers[
        'user-agent'
      ]
        ? {
            ua: String(
              req.headers[
                'user-agent'
              ],
            ),
          }
        : {}),

      ...(ip
        ? { ip }
        : {}),
    };

    return this.svc.initDonation({
      email,
      amountNaira,
      metadata,
      callbackUrl,
    });
  }

  /**
   * Legacy alias.
   */
  @Throttle({
    default: {
      limit: 10,
      ttl: 60_000,
    },
  })
  @HttpCode(200)
  @Post('init')
  async initAlias(
    @Req() req: Request,
    @Body() body: InitBody,
  ) {
    return this.initialize(
      req,
      body,
    );
  }

  /**
   * Paystack webhook.
   *
   * Do NOT apply the normal IP rate limiter
   * here. The HMAC signature is what authenticates
   * the request, and Paystack may deliver many
   * events from shared infrastructure.
   */
  @SkipThrottle()
  @Post('webhooks/paystack')
  async webhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers(
      'x-paystack-signature',
    )
    signature?: string,
  ) {
    /**
     * main.ts uses express.raw() on this route,
     * which puts the raw payload in req.body
     * as a Buffer.
     */
    const rawBody =
      Buffer.isBuffer(
        req.body,
      )
        ? req.body
        : (req as any)
            .rawBody;

    if (!rawBody) {
      return res
        .status(400)
        .send('invalid');
    }

    const result =
      await this.svc.handleWebhook(
        rawBody,
        signature,
      );

    if (!result.ok) {
      return res
        .status(400)
        .send('invalid');
    }

    return res
      .status(200)
      .send('ok');
  }
}