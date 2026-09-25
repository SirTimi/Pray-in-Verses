import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  Query,
} from '@nestjs/common';
import type { Request } from 'express';
import { CuratedPrayersService } from './curated-prayers.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PublishState } from '@prisma/client';

@Controller('browse')
export class CuratedPrayersController {
  constructor(
    private readonly service: CuratedPrayersService,
    private readonly prisma: PrismaService,
  ) {}

  // Books / Chapters / Verses
  @Get('books')
  async books() {
    const data = await this.service.listBooks();
    return { books: data };
  }

  @Get('books/:book/chapters')
  async chapters(@Param('book') book: string) {
    const data = await this.service.listChapters(book);
    return { data };
  }

  @Get('books/:book/chapters/:chapter/verses')
  async verses(
    @Param('book') book: string,
    @Param('chapter', ParseIntPipe) chapter: number,
  ) {
    const data = await this.service.listVerses(book, chapter);
    return { data };
  }

  // One verse (includes saved flag)
  @Get('verse/:book/:chapter/:verse')
  async verseContent(
    @Req() req: Request,
    @Param('book') book: string,
    @Param('chapter', ParseIntPipe) chapter: number,
    @Param('verse', ParseIntPipe) verse: number,
  ) {
    const userId = (req as any).user?.id as string | undefined;
    const data = await this.service.getByRef(book, chapter, verse, userId);
    return { data };
  }

  // Verse of the Day
  @Get('verse-of-the-day')
  async verseOfTheDay() {
    const data = await this.service.verseOfTheDay();
    return { data };
  }

  // Published curated-prayer count (for Browse banner)
  @Get('published-count')
  async publishedCount() {
    const count = await this.prisma.curatedPrayer.count({
      where: { state: PublishState.PUBLISHED },
    });
    return { count };
  }

  // Per-verse prayer-points count for a chapter
  @Get('books/:book/chapters/:chapter/counts')
  async chapterCounts(
    @Param('book') book: string,
    @Param('chapter', ParseIntPipe) chapter: number,
  ) {
    const data = await this.service.chapterCounts(book, chapter);
    return { data };
  }

  // Search (books, theme, insight, scriptureText + prayerPoints exact item)
  @Get('search')
  async search(@Query('q') q?: string) {
    const data = await this.service.search(q || '');
    return { data };
  }

  @Get('published-points-count')
  async publishedPointsCount(){ 
    const count = await this.service.publishedPointsCount();
    return {count};
  }

  @Get('prayer-points-count')
  async prayerPointsCount() {
    const count = await this.service.totalPrayerPoints();
    return { count };
  }
}
