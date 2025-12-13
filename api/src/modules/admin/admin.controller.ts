// src/admin/admin.controller.ts
import {
  BadRequestException,
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
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { JwtCookieAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateInviteDto, AcceptInviteDto, UpdateUserRoleDto } from './dto';
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto';
import { Role } from '@prisma/client';

@Controller('admin')
export class AdminController {
  constructor(private service: AdminService) {}

  // ------- Invites (SUPER_ADMIN only) -------
  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post('invites')
  async createInvite(@Req() req: Request, @Body() dto: CreateInviteDto) {
    const inviterId =
      (req as any)?.user?.id || (req as any)?.user?.sub || null;
    if (!inviterId) throw new BadRequestException('Invalid inviter');
    return this.service.createInvite(inviterId, dto);
  }

  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('invites')
  async invites() {
    return this.service.listInvites();
  }

  @Post('invites/accept')
  async accept(@Body() dto: AcceptInviteDto) {
    return this.service.acceptInvite(dto);
  }

  // ------- Users (list, update role, suspend/unsuspend) -------
  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MODERATOR)
  @Get('users')
  async users() {
    return this.service.listUsers();
  }

  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch('users/:id/role')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.service.updateUserRole(id, dto);
  }

  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch('users/:id/suspend')
  async suspendUser(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.service.suspendUser(id, body?.reason);
  }

  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch('users/:id/unsuspend')
  async unsuspendUser(@Param('id') id: string) {
    return this.service.unsuspendUser(id);
  }

  // ------- Broadcast notifications -------
  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post('notifications/broadcast')
  async broadcast(
    @Req() req: Request,
    @Body() dto: CreateNotificationDto,
  ) {
    const adminId =
      (req as any)?.user?.id || (req as any)?.user?.sub || null;
    if (!adminId) throw new BadRequestException('Invalid sender');

    return this.service.broadcastNotification(adminId, dto);
  }

  // ------- Lightweight identity lookup -------
  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MODERATOR, Role.EDITOR)
  @Get('users/lookup')
  async lookupUsers(@Query('ids') ids: string) {
    const list = (ids || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.length) {
      throw new BadRequestException('ids is required (comma-separated user IDs)');
    }
    const rows = await this.service.lookupUsersByIds(list);
    return {
      data: rows.map((u) => ({
        id: u.id,
        displayName: u.displayName ?? u.email ?? '—',
        email: u.email ?? null,
        role: u.role,
      })),
    };
  }
}
