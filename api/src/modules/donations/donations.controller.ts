// src/donations/donations.controller.ts
import { Body, Controller, Headers, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { DonationsService } from './donations.service';

type InitBody = {
  email: string;
  amount: number;              // NGN from client
  name?: string;
  message?: string;
  metadata?: Record<string, any>;
  callbackPath?: string;       // e.g. "/donations/thank-you"
  redirectUrl?: string;        // absolute URL; if a path, we’ll prefix APP_BASE_URL
};

@Controller('donations')
export class DonationsController {
  constructor(private svc: DonationsService) {}

  /**
   * Initialize a Paystack transaction and return authorization_url
   * Frontend calls: POST /api/donations/initialize
   */
  @HttpCode(200)
  @Post('initialize')
  async initialize(@Req() req: Request, @Body() body: InitBody) {
    // ---- sanitize inputs
    const email = String(body.email || '').trim().toLowerCase();
    const amountNaira = Number(body.amount || 0);
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return { status: 400, message: 'Invalid email' };
    }
    if (!Number.isFinite(amountNaira) || amountNaira < 100) {
      return { status: 400, message: 'Amount must be at least ₦100' };
    }

    // Normalize redirect target:
    // - redirectUrl beats callbackPath
    // - if a path is provided, prefix with APP_BASE_URL
    const appBase = (process.env.APP_BASE_URL || 'https://prayinverses.com').replace(/\/+$/, '');
    const normalizeUrl = (u?: string) => {
      if (!u) return undefined;
      try {
        // if absolute, keep it
        const url = new URL(u);
        return url.toString();
      } catch {
        // treat as path
        const path = u.startsWith('/') ? u : `/${u}`;
        return `${appBase}${path}`;
      }
    };

    const redirectUrl =
      normalizeUrl(body.redirectUrl) ||
      normalizeUrl(body.callbackPath) ||
      `${appBase}/donations/thank-you`;

    // enrich metadata
    const baseMeta = {
      name: body.name || undefined,
      message: body.message || undefined,
      source: 'web',
      ua: req.headers['user-agent'],
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress,
      ...body.metadata,
    };

    // Delegate to service
    const init = await this.svc.initDonation({
      email,
      amountNaira,
      metadata: baseMeta,
      callbackPath: redirectUrl, // service can pass this to Paystack as callback_url
    });

    // Expecting { authorization_url, reference, access_code, ... }
    return init;
  }

  /**
   * Legacy alias if you already shipped /donations/init
   */
  @HttpCode(200)
  @Post('init')
  async initAlias(@Req() req: Request, @Body() body: InitBody) {
    return this.initialize(req, body);
  }

  /**
   * Paystack webhook: must receive RAW body and compare HMAC-SHA512 signature.
   * Your main.ts sets raw body only for this route.
   */
  @Post('/webhooks/paystack')
  async webhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-paystack-signature') signature?: string,
  ) {
    // raw body from raw-body middleware (Buffer)
    const raw = (req as any).rawBody ?? (req as any).bodyRaw;
    // DonationsService will verify using PAYSTACK_SECRET_KEY
    const result = await this.svc.handleWebhook(raw, signature);
    if (!result.ok) return res.status(400).send('invalid');
    return res.status(200).send('ok');
  }
}
