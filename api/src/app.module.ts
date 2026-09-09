import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModule,
} from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CuratedPrayersModule } from './modules/curated-prayers/curated-prayers.module';
import { SavedPrayersModule } from './modules/saved-prayers/saved-prayers.module';
import { JournalsModule } from './modules/journals/journals.module';
import { AdminModule } from './modules/admin/admin.module';
import { AdminCuratedModule } from './modules/admin-curated/admin-curated.module';
import { BibleModule } from './modules/bible/bible.module';
import { PrayerWallModule } from './modules/prayer-wall/prayer-wall.module';
import { MyPrayersModule } from './modules/my-prayers/my-prayers.module';
import { StatsModule } from './modules/stats/stats.module';
import { HealthModule } from './health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { MailModule } from './modules/mail/mail.module';
import { DonationsModule } from './modules/donations/donations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    /**
     * Default API protection.
     *
     * Each client IP can make up to
     * 120 requests per minute per route.
     *
     * Sensitive authentication endpoints
     * override this with stricter limits.
     */
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),

    PrismaModule,
    AuthModule,
    CuratedPrayersModule,
    SavedPrayersModule,
    JournalsModule,
    AdminModule,
    AdminCuratedModule,
    BibleModule,
    PrayerWallModule,
    MyPrayersModule,
    StatsModule,
    HealthModule,
    IdentityModule,
    MailModule,
    DonationsModule,
    NotificationsModule,
  ],

  providers: [
    /**
     * Apply throttling globally.
     */
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}