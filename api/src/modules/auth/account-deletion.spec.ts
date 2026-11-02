import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService.deleteAccount', () => {
  const userId = 'user-to-delete';
  let prisma: any;
  let tx: any;
  let service: AuthService;

  beforeEach(() => {
    jest.resetAllMocks();

    tx = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ role: 'USER', status: 'ACTIVE' }),
        delete: jest.fn().mockResolvedValue({ id: userId }),
      },
      notification: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([
          { id: 'broadcast-1', targetUserIds: ['someone-else', userId] },
        ]),
        update: jest.fn().mockResolvedValue({}),
      },
      curatedPrayer: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      prayerComment: { deleteMany: jest.fn() },
      prayerLike: { deleteMany: jest.fn() },
      prayerBookmark: { deleteMany: jest.fn() },
      prayerRequest: {
        findMany: jest.fn().mockResolvedValue([{ id: 'request-1' }]),
        deleteMany: jest.fn(),
      },
      prayerPoint: { deleteMany: jest.fn() },
      passwordReset: { deleteMany: jest.fn() },
      savedPrayer: { deleteMany: jest.fn() },
      journal: { deleteMany: jest.fn() },
      userNotification: { deleteMany: jest.fn() },
      adminInvite: { deleteMany: jest.fn() },
    };

    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: userId,
          email: 'person@example.com',
          role: 'USER',
          status: 'ACTIVE',
          passwordHash: 'hashed-password',
        }),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    service = new AuthService(prisma, {} as any, {} as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('requires the current password before any deletion', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(service.deleteAccount(userId, 'wrong')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not delete staff accounts with shared administrative data', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: userId,
      role: 'EDITOR',
      status: 'ACTIVE',
      passwordHash: 'hashed-password',
    });

    await expect(service.deleteAccount(userId, 'password')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('removes linked personal data and clears reference IDs before deleting the user', async () => {
    await service.deleteAccount(userId, 'password');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.curatedPrayer.updateMany).toHaveBeenCalledWith({
      where: { createdById: userId },
      data: { createdById: null },
    });
    expect(tx.notification.update).toHaveBeenCalledWith({
      where: { id: 'broadcast-1' },
      data: { targetUserIds: ['someone-else'] },
    });
    expect(tx.prayerComment.deleteMany).toHaveBeenCalledWith({
      where: { userId },
    });
    expect(tx.prayerComment.deleteMany).toHaveBeenCalledWith({
      where: { requestId: { in: ['request-1'] } },
    });
    expect(tx.prayerRequest.deleteMany).toHaveBeenCalledWith({
      where: { createdById: userId },
    });
    expect(tx.prayerPoint.deleteMany).toHaveBeenCalledWith({ where: { userId } });
    expect(tx.passwordReset.deleteMany).toHaveBeenCalledWith({ where: { userId } });
    expect(tx.savedPrayer.deleteMany).toHaveBeenCalledWith({ where: { userId } });
    expect(tx.journal.deleteMany).toHaveBeenCalledWith({ where: { userId } });
    expect(tx.userNotification.deleteMany).toHaveBeenCalledWith({ where: { userId } });
    expect(tx.adminInvite.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { invitedBy: userId },
          { email: { equals: 'person@example.com', mode: 'insensitive' } },
        ],
      },
    });
    expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: userId } });
  });

  it('preserves user account when a referenced admin record blocks the transaction', async () => {
    tx.notification.count.mockResolvedValue(1);

    await expect(service.deleteAccount(userId, 'password')).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.user.delete).not.toHaveBeenCalled();
  });
});
