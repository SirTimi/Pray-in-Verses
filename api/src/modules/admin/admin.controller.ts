import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtCookieAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateInviteDto, AcceptInviteDto, UpdateUserRoleDto } from './dto';
import type { Request } from 'express';

@Controller('admin')
export class AdminController {
  constructor(private service: AdminService) {}

  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Post('invites')
  async createInvite(@Req() req: Request, @Body() dto: CreateInviteDto) {
    // @ts-ignore
    const inviterId = req.user.id as string;
    return this.service.createInvite(inviterId, dto);
  }

  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('invites')
  async invites() {
    return this.service.listInvites();
  }

  @Post('invites/accept')
  async accept(@Body() dto: AcceptInviteDto) {
    return this.service.acceptInvite(dto);
  }

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

  // NEW: used by the dashboard chips
  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'MODERATOR', 'EDITOR')
  @Get('users/lookup')
  async lookupUsers(@Query('ids') ids: string) {
    const list = await this.service.lookupUsersByIds(
      (ids || '').split(',').map((s) => s.trim()).filter(Boolean),
    );
    return {
      data: list.map((u) => ({
        id: u.id,
        displayName: u.displayName ?? u.email ?? '—',
        email: u.email ?? null,
        role: u.role,
      })),
    };
  }
}
