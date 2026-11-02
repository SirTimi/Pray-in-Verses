/// <reference types="jest" />
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrayerReportStatus, PrayerReportTarget } from '@prisma/client';
import { PrayerWallService } from './prayer-wall.service';

describe('Prayer Wall community safety', () => {
  let db: any;
  let service: PrayerWallService;
  beforeEach(() => {
    jest.resetAllMocks();
    db = {
      userBlock: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockResolvedValue({ id: 'block-1' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      prayerRequest: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'post-1', createdById: 'author', hidden: false,
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      prayerComment: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'comment-1', userId: 'author', hidden: false,
        }),
      },
      prayerReport: {
        upsert: jest.fn().mockResolvedValue({ id: 'report-1' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    service = new PrayerWallService(db);
  });

  it('excludes blocked authors and moderated posts from the feed query', async () => {
    db.userBlock.findMany.mockResolvedValue([{
      blockerId: 'viewer', blockedId: 'author',
    }]);
    await service.list('viewer', undefined, undefined, undefined, 20);
    const query = db.prayerRequest.findMany.mock.calls[0][0];
    expect(query.where).toEqual({ hidden: false, createdById: { notIn: ['author'] } });
    expect(query.include._count.select.comments.where).toEqual({
      hidden: false, userId: { notIn: ['author'] },
    });
  });

  it('does not skip a prayer request between paginated feed pages', async () => {
    const posts = Array.from({ length: 5 }, (_, index) => ({
      id: `post-${index + 1}`, createdById: 'author', anonymous: false,
    }));
    db.prayerRequest.findMany.mockImplementation(async (query: any) => {
      const start = query.cursor
        ? posts.findIndex((post) => post.id === query.cursor.id) + query.skip
        : 0;
      return posts.slice(start, start + query.take);
    });

    const first = await service.list('viewer', undefined, undefined, null, 2);
    expect(first.data.map((post) => post.id)).toEqual(['post-1', 'post-2']);
    expect(first.nextCursor).toBe('post-2');

    const second = await service.list('viewer', undefined, undefined, first.nextCursor, 2);
    expect(second.data.map((post) => post.id)).toEqual(['post-3', 'post-4']);
    expect(second.nextCursor).toBe('post-4');

    const third = await service.list('viewer', undefined, undefined, second.nextCursor, 2);
    expect(third.data.map((post) => post.id)).toEqual(['post-5']);
    expect(third.nextCursor).toBeNull();
  });

  it('does not allow blocked authors to be opened directly', async () => {
    db.userBlock.findMany.mockResolvedValue([{
      blockerId: 'viewer', blockedId: 'author',
    }]);
    await expect(service.get('post-1', 'viewer')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('accepts reporting of an existing post without revealing the author', async () => {
    const reply = await service.report('viewer', {
      targetType: PrayerReportTarget.REQUEST, targetId: 'post-1', reason: 'SPAM',
    });
    expect(reply).toEqual({ id: 'report-1', ok: true });
    expect(db.prayerReport.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ reporterId: 'viewer', targetId: 'post-1' }),
      }),
    );
  });

  it('blocks anonymous post authors without returning their identity', async () => {
    expect(await service.blockAuthor('viewer', { requestId: 'post-1' })).toEqual({ ok: true });
    expect(db.userBlock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { blockerId: 'viewer', blockedId: 'author' },
      }),
    );
  });

  it('cannot block yourself', async () => {
    db.prayerRequest.findUnique.mockResolvedValue({
      id: 'post-1', createdById: 'viewer', hidden: false,
    });
    await expect(service.blockAuthor('viewer', { requestId: 'post-1' }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(db.userBlock.upsert).not.toHaveBeenCalled();
  });

  it('only returns opaque block IDs and dates', async () => {
    db.userBlock.findMany.mockResolvedValue([{ id: 'block-1', createdAt: new Date('2026-11-02') }]);
    const result = await service.listBlocks('viewer');
    expect(result.data[0]).not.toHaveProperty('blockedId');
    expect(result.data[0]).not.toHaveProperty('displayName');
  });
});
