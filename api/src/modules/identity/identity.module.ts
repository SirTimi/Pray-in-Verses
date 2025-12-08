// apps/api/src/identity/identity.module.ts
import { Module } from '@nestjs/common';
import { IdentityController } from './identity.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [IdentityController],
  providers: [PrismaService],
})
export class IdentityModule {}
