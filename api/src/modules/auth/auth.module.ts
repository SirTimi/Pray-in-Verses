import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtCookieAuthGuard } from './jwt.guard';
import { RolesGuard } from './roles.guard';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule, 
    MailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET!,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtCookieAuthGuard, RolesGuard],
  // ⬇️ Export JwtModule (so JwtService is available elsewhere),
  //    and export the guards so other modules can use @UseGuards with them.
  exports: [JwtModule, AuthService, JwtCookieAuthGuard, RolesGuard],
})
export class AuthModule {}
