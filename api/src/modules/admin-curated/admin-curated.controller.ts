// src/modules/admin-curated/admin-curated.controller.ts
import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards,
  DefaultValuePipe, ParseIntPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { PublishState } from '@prisma/client';

import { AdminCuratedService } from './admin-curated.service';
import { JwtCookieAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

import {
  CreateCuratedPrayerDto,
  ListQuery,
  TransitionDto,
  UpdateCuratedPrayerDto,
  PrayerPointsReplaceDto,
  PrayerPointTextDto,
  PrayerPointsReorderDto,
  UpdatePublishStateDto,
} from './dto';

@UseGuards(JwtCookieAuthGuard, RolesGuard)
@Roles('EDITOR','MODERATOR','SUPER_ADMIN')
@Controller('admin/curated-prayers')
export class AdminCuratedController {
  constructor(private service: AdminCuratedService) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query('q') q: string = '',
    @Query('state') state?: PublishState | string,
    @Query('book') book: string = '',
    @Query('chapter') chapter?: string,
    @Query('verse') verse?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
    @Query('cursor') cursor?: string,
  ) {
    // @ts-ignore
    const role = req.user.role;
    return this.service.list(role, q, state, book, chapter, verse, limit, cursor ?? null);
  }

  // ---- Create ----
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateCuratedPrayerDto) {
    // @ts-ignore
    const userId = req.user.id as string;
    return this.service.create(userId, dto);
  }

  // ---- Read ----
  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.get(id);
  }

  // ---- Update main fields ----
  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateCuratedPrayerDto,
  ) {
    // @ts-ignore
    const userId = req.user.id as string;
    // @ts-ignore
    const role = req.user.role;
    return this.service.update(userId, role, id, dto);
  }

  // ---- Transition helper (REVIEW / PUBLISHED / ARCHIVED) ----
  @Post(':id/transition')
  async transition(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: TransitionDto,
  ) {
    // @ts-ignore
    const userId = req.user.id as string;
    // @ts-ignore
    const role = req.user.role;
    return this.service.transition(userId, role, id, body.target as PublishState);
  }

  // Optional: simpler publish-state endpoint (PATCH)
  @Patch(':id/publish-state')
  async updatePublishState(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: UpdatePublishStateDto,
  ) {
    // @ts-ignore
    const userId = req.user.id as string;
    // @ts-ignore
    const role = req.user.role;
    return this.service.transition(userId, role, id, body.state);
  }

  // ---- Delete ----
  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    // @ts-ignore
    const userId = req.user.id as string;
    // @ts-ignore
    const role = req.user.role;
    return this.service.remove(userId, role, id);
  }

  // =========================
  // Per-point editing (array)
  // =========================

  /** Replace entire prayerPoints array (allows empty). */
  @Patch(':id/prayer-points')
  async replacePoints(
    @Param('id') id: string,
    @Body() body: PrayerPointsReplaceDto,
  ) {
    return this.service.replacePrayerPoints(id, body.items);
  }

  /** Append a single point to the end. */
  @Post(':id/prayer-points')
  async appendPoint(
    @Param('id') id: string,
    @Body() body: PrayerPointTextDto,
  ) {
    return this.service.appendPrayerPoint(id, body.text);
  }

  /** Update one point by index (0-based). */
  @Patch(':id/prayer-points/:index')
  async updatePoint(
    @Param('id') id: string,
    @Param('index', ParseIntPipe) index: number,
    @Body() body: PrayerPointTextDto,
  ) {
    return this.service.updatePrayerPointAt(id, index, body.text);
  }

  /** Remove one point by index (0-based). */
  @Delete(':id/prayer-points/:index')
  async removePoint(
    @Param('id') id: string,
    @Param('index', ParseIntPipe) index: number,
  ) {
    return this.service.removePrayerPointAt(id, index);
  }

  /** Reorder: move item from `from` → `to` (0-based). */
  @Post(':id/prayer-points/reorder')
  async reorderPoints(
    @Param('id') id: string,
    @Body() body: PrayerPointsReorderDto,
  ) {
    return this.service.reorderPrayerPoints(id, body.from, body.to);
  }
}
