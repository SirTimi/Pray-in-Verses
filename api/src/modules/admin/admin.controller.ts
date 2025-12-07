// src/admin/admin.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtCookieAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateInviteDto, AcceptInviteDto, UpdateUserRoleDto } from './dto';
import type { Request } from 'express';

@Controller('admin')
export class AdminController {
  constructor(private service: AdminService) {}

  // ---------------------- Invites (SUPER_ADMIN) ----------------------
  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Post('invites')
  async createInvite(@Req() req: Request, @Body() dto: CreateInviteDto) {
    // @ts-ignore
    const inviterId = (req.user as any).id as string;
    return this.service.createInvite(inviterId, dto);
  }

  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('invites')
  async invites() {
    return this.service.listInvites();
  }

  // Public accept
  @Post('invites/accept')
  async accept(@Body() dto: AcceptInviteDto) {
    return this.service.acceptInvite(dto);
  }

  // ---------------------- Users (SUPER_ADMIN) ------------------------
  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('users')
  async users() {
    return this.service.listUsers();
  }

  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Patch('users/:id/role')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.service.updateUserRole(id, dto);
  }

  // ---------------------- Read-only lookup (ALL ADMIN ROLES) ---------
  // Allows SUPER_ADMIN, MODERATOR, EDITOR to resolve identities by id.
  // GET /admin/users/lookup?ids=a,b,c
  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'MODERATOR', 'EDITOR')
  @Get('users/lookup')
  async lookupUsers(@Query('ids') ids: string) {
    const list = await this.service.lookupUsersByIds(
      (ids || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );

    // Normalize to the minimal shape the frontend expects.
    return {
      data: list.map((u) => ({
        id: u.id,
        displayName: u.displayName ?? u.email ?? '—',
        email: u.email ?? null,
        role: u.role, // 'SUPER_ADMIN' | 'MODERATOR' | 'EDITOR' | 'USER'
      })),
    };
  }
}
