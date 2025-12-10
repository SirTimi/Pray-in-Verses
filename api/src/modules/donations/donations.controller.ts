// src/donations/donations.controller.ts
import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { DonationsService } from './donations.service';
import type { Request, Response } from 'express';

@Controller('donations')
export class DonationsController {
  constructor(private svc: DonationsService) {}

  @Post('init')
  async init(@Body() body: { email: string; amount: number; metadata?: any; callbackPath?: string }) {
    return this.svc.initDonation({
      email: body.email,
      amountNaira: body.amount, // from the client in NGN
      metadata: body.metadata,
      callbackPath: body.callbackPath,
    });
  }

  // Paystack webhooks must receive the RAW body for signature verification
  @Post('/webhooks/paystack')
  async webhook(@Req() req: Request, @Res() res: Response) {
    const rawBody = (req as any).rawBody || (req as any).bodyRaw || JSON.stringify(req.body);
    const signature = req.headers['x-paystack-signature'] as string | undefined;

    const result = await this.svc.handleWebhook(rawBody, signature);
    if (!result.ok) return res.status(400).send('invalid');
    return res.status(200).send('ok');
  }
}
