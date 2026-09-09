// api/src/modules/identity/identity.module.ts

import { Module } from '@nestjs/common';

import { IdentityController } from './identity.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],

  controllers: [
    IdentityController,
  ],
})
export class IdentityModule {}