import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import * as userService from '../../../services/user.service.js';
import { prisma } from '../../mocks/prisma.js';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: '$2a$10$placeholder',
  subscriptionTier: 'FREE',
  subscriptionStatus: 'active',
  monthlyRequestCount: 0,
  monthlyRequestLimit: 10000,
  projectLimit: 1,
  pendingDowngrade: false,
  downgradeDate: null,
  downgradeTo: null,
  currentPeriodEnd: null,
  createdAt: new Date(),
  lastActiveAt: new Date(),
};

describe('userService — getProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 404 when user is not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(userService.getProfile('nonexistent'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns user profile when found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser, _count: { projects: 2 },
    } as any);

    const result = await userService.getProfile('user-1');

    expect(result.id).toBe('user-1');
    expect(result.email).toBe('test@example.com');
  });
});

describe('userService — updateProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 404 when user is not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(userService.updateProfile('nonexistent', { name: 'New Name' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('updates name when provided', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, name: 'New Name' } as any);

    await userService.updateProfile('user-1', { name: 'New Name' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'New Name' }),
      })
    );
  });

  it('throws validation error when new email is already in use', async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(mockUser as any)
      .mockResolvedValueOnce({ id: 'other-user', email: 'taken@example.com' } as any);

    await expect(
      userService.updateProfile('user-1', { email: 'taken@example.com' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('does not check email uniqueness if email matches current email', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    await userService.updateProfile('user-1', { email: 'test@example.com' });

    // findUnique called only once (for the user lookup, not for email check)
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it('throws validation error for wrong current password', async () => {
    const hash = await bcrypt.hash('correct-pass', 10);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser, passwordHash: hash,
    } as any);

    await expect(
      userService.updateProfile('user-1', {
        currentPassword: 'wrong-pass',
        newPassword: 'newsecurepass',
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('updates password hash when correct current password is provided', async () => {
    const hash = await bcrypt.hash('correct-pass', 10);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser, passwordHash: hash,
    } as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    await userService.updateProfile('user-1', {
      currentPassword: 'correct-pass',
      newPassword: 'new-secure-pass',
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: expect.any(String),
        }),
      })
    );
  });
});

describe('userService — deleteAccount', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 404 when user is not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(userService.deleteAccount('nonexistent'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('deletes user when found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.delete).mockResolvedValue(mockUser as any);

    await userService.deleteAccount('user-1');

    expect(prisma.user.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } })
    );
  });
});

describe('userService — exportUserData', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 404 when user is not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(userService.exportUserData('nonexistent'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns user data with projects, subscription history, and invoices', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser,
      projects: [{ id: 'p-1', name: 'Project 1', createdAt: new Date(), requests: [] }],
      subscriptionHistory: [],
      invoices: [],
    } as any);

    const result = await userService.exportUserData('user-1');

    expect(result.user.id).toBe('user-1');
    expect(result.projects).toHaveLength(1);
    expect(result.subscriptionHistory).toEqual([]);
    expect(result.invoices).toEqual([]);
  });

  it('does not include passwordHash in exported user data', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser,
      projects: [],
      subscriptionHistory: [],
      invoices: [],
    } as any);

    const result = await userService.exportUserData('user-1');

    expect(result.user).not.toHaveProperty('passwordHash');
  });
});
