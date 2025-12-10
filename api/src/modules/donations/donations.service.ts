// src/donations/donations.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import fetch from 'node-fetch';
import * as crypto from 'crypto';

const PSTACK = process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';

@Injectable()
export class DonationsService {
  constructor(private prisma: PrismaService) {}

  private secret() { return process.env.PAYSTACK_SECRET_KEY || ''; }

  async initDonation(input: {
    email: string;
    amountNaira: number; // from client in NGN (whole naira)
    metadata?: Record<string, any>;
    callbackPath?: string; // e.g. '/donate/thanks'
  }) {
    const amountKobo = Math.round(input.amountNaira * 100);
    if (!input.email || amountKobo < 100) {
      throw new BadRequestException('Invalid email or amount');
    }

    // 1) Create local record
    const ref = `PIV_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const donation = await this.prisma.donation.create({
      data: {
        reference: ref,
        email: input.email.toLowerCase().trim(),
        amountNGN: amountKobo,         // storing kobo here
        currency: 'NGN',
        status: 'initialized',
        metadata: input.metadata ?? {},
      },
    });

    // 2) Create Paystack transaction
    const callback_url = `${process.env.APP_BASE_URL}${input.callbackPath || '/donate/success'}`;
    const resp = await fetch(`${PSTACK}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secret()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: donation.email,
        amount: amountKobo,
        reference: ref,
        currency: 'NGN',
        callback_url,
        metadata: donation.metadata,
      }),
    });
    const data = await resp.json();
    if (!data?.status) {
      throw new BadRequestException(`Paystack init failed: ${data?.message || 'unknown error'}`);
    }

    // 3) Optional: persist gateway response
    await this.prisma.donation.update({
      where: { id: donation.id },
      data: { gatewayRaw: data, status: 'pending' },
    });

    // 4) Return the authorization url to client
    return { authorization_url: data.data.authorization_url, reference: ref };
  }

  verifySignature(rawBody: string, signature?: string) {
    if (!signature) return false;
    const hash = crypto.createHmac('sha512', this.secret()).update(rawBody, 'utf8').digest('hex');
    return hash === signature;
  }

  async handleWebhook(rawBody: string, signature?: string) {
    if (!this.verifySignature(rawBody, signature)) return { ok: false };

    const event = JSON.parse(rawBody);
    // Paystack standard event: 'charge.success'
    const ref = event?.data?.reference as string | undefined;
    const status = event?.event as string;

    if (!ref) return { ok: false };

    if (status === 'charge.success') {
      await this.prisma.donation.updateMany({
        where: { reference: ref },
        data: {
          status: 'success',
          paidAt: new Date(event.data.paidAt || Date.now()),
          gatewayRaw: event, // store full event for audit
        },
      });
    } else if (status?.includes('failed') || status?.includes('abandoned')) {
      await this.prisma.donation.updateMany({
        where: { reference: ref },
        data: { status: 'failed', gatewayRaw: event },
      });
    } else {
      // other events → just store raw for inspection
      await this.prisma.donation.updateMany({
        where: { reference: ref },
        data: { gatewayRaw: event },
      });
    }

    return { ok: true };
  }

  // Optional: verify from client redirect (defensive double-check on success page)
  async verifyReference(reference: string) {
    const resp = await fetch(`${PSTACK}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${this.secret()}` },
    });
    const data = await resp.json();
    return data;
  }
}
