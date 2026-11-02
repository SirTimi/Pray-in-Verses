import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrayerWallService } from './prayer-wall.service';
import { PrayerWallController } from './prayer-wall.controller';
import { PrayerModerationController } from './moderation.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ AuthModule],
  controllers: [PrayerWallController, PrayerModerationController],
  providers: [PrayerWallService, PrismaService],
})
export class PrayerWallModule {}
