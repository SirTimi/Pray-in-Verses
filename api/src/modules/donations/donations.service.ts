import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

type RawBody =
  | string
  | Buffer;

@Injectable()
export class DonationsService {
  private readonly logger =
    new Logger(
      DonationsService.name,
    );

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private get paystackBase(): string {
    return (
      process.env
        .PAYSTACK_BASE_URL ||
      'https://api.paystack.co'
    ).replace(/\/+$/, '');
  }

  private secret(): string {
    const secret =
      process.env
        .PAYSTACK_SECRET_KEY;

    if (!secret) {
      throw new Error(
        'PAYSTACK_SECRET_KEY is not configured',
      );
    }

    return secret;
  }

  // =========================================================
  // Initialize donation
  // =========================================================

  async initDonation(input: {
    email: string;
    amountNaira: number;
    metadata?: Prisma.InputJsonObject;
    callbackUrl: string;
  }) {
    /**
     * Paystack expects NGN amounts in kobo.
     */
    const amountKobo =
      Math.round(
        input.amountNaira *
          100,
      );

    if (
      !input.email ||
      amountKobo <
        10_000
    ) {
      throw new BadRequestException(
        'Invalid email or amount',
      );
    }

    /**
     * Generate a server-side transaction
     * reference.
     */
    const reference =
      `PIV_${Date.now()}_${crypto
        .randomBytes(8)
        .toString('hex')}`;

    const donation =
      await this.prisma.donation.create({
        data: {
          reference,

          email:
            input.email
              .toLowerCase()
              .trim(),

          /**
           * Despite the old field name,
           * this value is stored in KOBO.
           */
          amountNGN:
            amountKobo,

          currency:
            'NGN',

          status:
            'initialized',

          metadata:
            input.metadata ??
            {},
        },
      });

    try {
      /**
       * Node 18+ already provides native fetch,
       * so we do not need node-fetch.
       */
      const response =
        await fetch(
          `${this.paystackBase}/transaction/initialize`,
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${this.secret()}`,

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                email:
                  donation.email,

                amount:
                  amountKobo,

                reference,

                currency:
                  'NGN',

                /**
                 * Already a complete, validated URL.
                 *
                 * Do NOT prefix APP_BASE_URL again.
                 */
                callback_url:
                  input.callbackUrl,

                metadata:
                  donation.metadata,
              }),
          },
        );

      const data:
        any =
        await response.json();

      if (
        !response.ok ||
        !data?.status ||
        !data?.data
          ?.authorization_url
      ) {
        this.logger.warn(
          `Paystack initialize failed for ${reference}: ${
            data?.message ||
            response.status
          }`,
        );

        await this.prisma.donation.update({
          where: {
            id:
              donation.id,
          },

          data: {
            status:
              'failed',

            gatewayRaw:
              data ?? {},
          },
        });

        throw new BadRequestException(
          'Unable to initialize donation',
        );
      }

      await this.prisma.donation.update({
        where: {
          id:
            donation.id,
        },

        data: {
          gatewayRaw:
            data,

          status:
            'pending',
        },
      });

      return {
        authorization_url:
          data.data
            .authorization_url,

        access_code:
          data.data
            .access_code,

        reference,
      };
    } catch (error) {
      if (
        error instanceof
        BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Paystack initialize request failed for ${reference}`,
        error instanceof Error
          ? error.stack
          : undefined,
      );

      await this.prisma.donation
        .update({
          where: {
            id:
              donation.id,
          },

          data: {
            status:
              'failed',
          },
        })
        .catch(
          () => undefined,
        );

      throw new BadRequestException(
        'Unable to initialize donation',
      );
    }
  }

  // =========================================================
  // Signature verification
  // =========================================================

  verifySignature(
    rawBody: RawBody,
    signature?: string,
  ): boolean {
    if (
      !signature
    ) {
      return false;
    }

    /**
     * Paystack sends a 64-byte SHA-512 HMAC
     * represented as 128 hex characters.
     */
    const supplied =
      signature
        .trim()
        .toLowerCase();

    if (
      !/^[0-9a-f]{128}$/.test(
        supplied,
      )
    ) {
      return false;
    }

    const expected =
      crypto
        .createHmac(
          'sha512',
          this.secret(),
        )
        .update(rawBody)
        .digest();

    const provided =
      Buffer.from(
        supplied,
        'hex',
      );

    if (
      expected.length !==
      provided.length
    ) {
      return false;
    }

    /**
     * Constant-time comparison.
     */
    return crypto.timingSafeEqual(
      expected,
      provided,
    );
  }

  // =========================================================
  // Webhook
  // =========================================================

  async handleWebhook(
    rawBody: RawBody,
    signature?: string,
  ) {
    if (
      !this.verifySignature(
        rawBody,
        signature,
      )
    ) {
      return {
        ok: false,
      };
    }

    let event: any;

    try {
      event =
        JSON.parse(
          Buffer.isBuffer(
            rawBody,
          )
            ? rawBody.toString(
                'utf8',
              )
            : rawBody,
        );
    } catch {
      return {
        ok: false,
      };
    }

    const reference =
      typeof event?.data
        ?.reference ===
      'string'
        ? event.data
            .reference
        : undefined;

    const eventName =
      typeof event?.event ===
      'string'
        ? event.event
        : '';

    if (!reference) {
      return {
        ok: false,
      };
    }

    /**
     * Only touch a donation that actually
     * belongs to Pray in Verses.
     */
    const donation =
      await this.prisma.donation.findUnique({
        where: {
          reference,
        },

        select: {
          id: true,
          amountNGN: true,
          currency: true,
          status: true,
        },
      });

    /**
     * Valid Paystack event, but not one of
     * our donation references.
     *
     * Acknowledge it without changing anything.
     */
    if (!donation) {
      return {
        ok: true,
      };
    }

    // ---------------------------------------------------------
    // Successful payment
    // ---------------------------------------------------------

    if (
      eventName ===
      'charge.success'
    ) {
      const gatewayAmount =
        Number(
          event?.data
            ?.amount,
        );

      const gatewayCurrency =
        String(
          event?.data
            ?.currency ||
            '',
        ).toUpperCase();

      const gatewayStatus =
        String(
          event?.data
            ?.status ||
            '',
        ).toLowerCase();

      /**
       * Signature alone proves Paystack sent
       * the event.
       *
       * We still ensure the successful transaction
       * matches the amount and currency we created.
       */
      const matches =
        gatewayStatus ===
          'success' &&
        Number.isInteger(
          gatewayAmount,
        ) &&
        gatewayAmount ===
          donation.amountNGN &&
        gatewayCurrency ===
          donation.currency;

      if (!matches) {
        this.logger.warn(
          `Paystack verification mismatch for ${reference}`,
        );

        await this.prisma.donation.update({
          where: {
            id:
              donation.id,
          },

          data: {
            gatewayRaw:
              event,
          },
        });

        /**
         * Acknowledge the authentic event so
         * Paystack does not repeatedly retry it,
         * but DO NOT mark the donation paid.
         */
        return {
          ok: true,
        };
      }

      /**
       * Paystack uses paid_at.
       *
       * The previous code checked paidAt, so it
       * usually fell back to Date.now().
       */
      const paidAtValue =
        event?.data
          ?.paid_at;

      const parsedPaidAt =
        paidAtValue
          ? new Date(
              paidAtValue,
            )
          : new Date();

      const paidAt =
        Number.isNaN(
          parsedPaidAt
            .getTime(),
        )
          ? new Date()
          : parsedPaidAt;

      await this.prisma.donation.update({
        where: {
          id:
            donation.id,
        },

        data: {
          status:
            'success',

          paidAt,

          gatewayRaw:
            event,
        },
      });

      return {
        ok: true,
      };
    }

    // ---------------------------------------------------------
    // Failed payment
    // ---------------------------------------------------------

    if (
      eventName.includes(
        'failed',
      ) ||
      eventName.includes(
        'abandoned',
      )
    ) {
      await this.prisma.donation.update({
        where: {
          id:
            donation.id,
        },

        data: {
          status:
            'failed',

          gatewayRaw:
            event,
        },
      });

      return {
        ok: true,
      };
    }

    /**
     * Other authentic Paystack event.
     * Preserve for audit but don't alter
     * payment state.
     */
    await this.prisma.donation.update({
      where: {
        id:
          donation.id,
      },

      data: {
        gatewayRaw:
          event,
      },
    });

    return {
      ok: true,
    };
  }

  // =========================================================
  // Verify reference
  // =========================================================

  async verifyReference(
    reference: string,
  ) {
    const response =
      await fetch(
        `${this.paystackBase}/transaction/verify/${encodeURIComponent(
          reference,
        )}`,
        {
          headers: {
            Authorization:
              `Bearer ${this.secret()}`,
          },
        },
      );

    return response.json();
  }
}