import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DonationStatusService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getByReference(
    reference: string,
  ) {
    const donation =
      await this.prisma.donation.findUnique({
        where: {
          reference,
        },
        select: {
          reference: true,
          amountNGN: true,
          currency: true,
          status: true,
          createdAt: true,
          paidAt: true,
        },
      });

    if (!donation) {
      return null;
    }

    return {
      reference:
        donation.reference,
      amount:
        donation.amountNGN / 100,
      currency:
        donation.currency,
      status:
        donation.status,
      createdAt:
        donation.createdAt,
      paidAt:
        donation.paidAt,
    };
  }
}
