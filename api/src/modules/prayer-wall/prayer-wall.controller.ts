// src/modules/prayer-wall/prayer-wall.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Delete,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtCookieAuthGuard } from '../auth/jwt.guard';
import { Throttle } from '@nestjs/throttler';
import { PrayerWallService } from './prayer-wall.service';
import { CreatePrayerRequestDto, AddCommentDto, ReportPrayerContentDto, BlockPrayerAuthorDto } from './dto';
import type { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

@UseGuards(JwtCookieAuthGuard)
@Controller('prayer-wall') // <-- was 'wall'
export class PrayerWallController {
  constructor(
    private service: PrayerWallService,
    private prisma: PrismaService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 10 * 60_000 } })
  @Post()
  async create(@Req() req: Request, @Body() dto: CreatePrayerRequestDto) {
    // @ts-ignore
    return this.service.create(req.user.id, dto);
  }

  @Get()
  async list(
    @Req() req: Request,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit = '20',
  ) {
    return this.service.list(
      (req as any).user.id,
      q,
      category,
      cursor ?? null,
      Math.min(Number(limit) || 20, 50),
    );
  }

  @Throttle({ default: { limit: 6, ttl: 10 * 60_000 } })
  @Post('reports')
  @HttpCode(200)
  async report(@Req() req: Request, @Body() dto: ReportPrayerContentDto) {
    return this.service.report((req as any).user.id, dto);
  }

  @Post('blocks')
  @HttpCode(200)
  async block(@Req() req: Request, @Body() dto: BlockPrayerAuthorDto) {
    return this.service.blockAuthor((req as any).user.id, dto);
  }

  @Get('blocks')
  async blocks(@Req() req: Request) {
    return this.service.listBlocks((req as any).user.id);
  }

  @Delete('blocks/:blockId')
  async unblock(@Req() req: Request, @Param('blockId') blockId: string) {
    return this.service.unblock((req as any).user.id, blockId);
  }

  @Get(':id')
  async get(@Param('id') id: string, @Req() req: Request) {
    return this.service.get(id, (req as any).user.id);
  }

  @Post(':id/like')
  async toggleLike(@Req() req: Request, @Param('id') id: string) {
    // @ts-ignore
    return this.service.toggleLike(req.user.id, id);
  }

  @Post(':id/bookmark')
  async toggleBookmark(@Req() req: Request, @Param('id') id: string) {
    // @ts-ignore
    return this.service.toggleBookmark(req.user.id, id);
  }

  @Throttle({ default: { limit: 12, ttl: 10 * 60_000 } })
  @Post(':id/comments')
  async addComment(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AddCommentDto,
  ) {
    // @ts-ignore
    return this.service.addComment(req.user.id, id, dto.body);
  }

  @Delete('comments/:commentId')
  async removeComment(@Req() req: Request, @Param('commentId') commentId: string) {
    // @ts-ignore
    return this.service.removeComment(req.user.id, commentId);
  }

  // Optional helper for the header banner
  @Get('stats')
  async stats() {
    const [users, requests] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.prayerRequest.count(),
    ]);
    return { users, requests };
  }
}
