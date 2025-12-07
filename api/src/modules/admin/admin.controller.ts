import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtCookieAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateInviteDto, AcceptInviteDto, UpdateUserRoleDto } from './dto';
import type { Request } from 'express';

@Controller('admin')
export class AdminController {
  constructor(private service: AdminService) {}

  // Create invite (SUPER_ADMIN)
  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Post('invites')
  async createInvite(@Req() req: Request, @Body() dto: CreateInviteDto) {
    // @ts-ignore
    const inviterId = req.user.id as string;
    return this.service.createInvite(inviterId, dto);
  }

  // List invites (SUPER_ADMIN)
  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('invites')
  async invites() {
    return this.service.listInvites();
  }

  // Accept invite (PUBLIC)
  @Post('invites/accept')
  async accept(@Body() dto: AcceptInviteDto) {
    return this.service.acceptInvite(dto);
  }

  // List users (SUPER_ADMIN)
  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Get('users')
  async users() {
    return this.service.listUsers();
  }

  // Update user role (SUPER_ADMIN)
  @UseGuards(JwtCookieAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Patch('users/:id/role')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.service.updateUserRole(id, dto);
  }
}
