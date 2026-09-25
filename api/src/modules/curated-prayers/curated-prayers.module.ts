import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';

import { CuratedPrayersController } from './curated-prayers.controller';
import { CuratedPrayersService } from './curated-prayers.service';
import { AuthModule } from '../auth/auth.module';
import { OptionalAuthMiddleware } from '../common/optional-auth.middleware';

@Module({
  imports: [AuthModule],
  controllers: [CuratedPrayersController],
  providers: [
    CuratedPrayersService,
    OptionalAuthMiddleware,
  ],
  exports: [CuratedPrayersService],
})
export class CuratedPrayersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(OptionalAuthMiddleware)
      .forRoutes(CuratedPrayersController);
  }
}
