import { Module } from '@nestjs/common';
import { DonationStatusService } from './donation-status.service';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';

@Module({
  controllers: [DonationsController],
  providers: [
    DonationsService,
    DonationStatusService,
  ],
  exports: [DonationsService],
})
export class DonationsModule {}
