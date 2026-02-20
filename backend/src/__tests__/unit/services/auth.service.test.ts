import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as authService from '../../../services/auth.service.js';
import { prisma } from '../../mocks/prisma.js';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: '$2a$10$hashedpassword',
  isAdmin: false,
  isBanned: false,
  subscriptionTier: 'FREE',
  subscriptionStatus: 'active',
  monthlyRequestCount: 0,
  monthlyRequestLimit: 10000,
  projectLimit: 1,
  firstApiCallAt: null,
};

describe('auth.service — register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 409 EMAIL_EXISTS if email is already taken', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

    await expect(
      authService.register({ email: 'test@example.com', password: 'password123' })
    ).rejects.toMatchObject({ code: 'EMAIL_EXISTS', statusCode: 409 });
  });

  it('creates user and returns token on successful registration', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      ...mockUser,
      id: 'new-user-1',
      email: 'new@example.com',
    } as any);

    const result = await authService.register({
      email: 'new@example.com',
      password: 'securepassword',
    });

    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe('new@example.com');
  });

  it('hashes the password before storing', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({ ...mockUser } as any);

    await authService.register({ email: 'new@example.com', password: 'plain-password' });

    const createCall = vi.mocked(prisma.user.create).mock.calls[0][0];
    expect(createCall.data.passwordHash).toBeTruthy();
    expect(createCall.data.passwordHash).not.toBe('plain-password');
    const isHashed = await bcrypt.compare('plain-password', createCall.data.passwordHash as string);
    expect(isHashed).toBe(true);
  });

  it('does not include passwordHash in returned user object', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({ ...mockUser } as any);

    const result = await authService.register({ email: 'new@example.com', password: 'password' });

    expect(result.user).not.toHaveProperty('passwordHash');
  });
});

describe('auth.service — login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 401 for non-existent email', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(
      authService.login({ email: 'nouser@example.com', password: 'pass' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 for wrong password', async () => {
    const hash = await bcrypt.hash('correct-password', 10);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...mockUser, passwordHash: hash } as any);

    await expect(
      authService.login({ email: 'test@example.com', password: 'wrong-password' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 403 ACCOUNT_BANNED for banned user', async () => {
    const hash = await bcrypt.hash('password', 10);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser, isBanned: true, passwordHash: hash,
    } as any);

    await expect(
      authService.login({ email: 'test@example.com', password: 'password' })
    ).rejects.toMatchObject({ code: 'ACCOUNT_BANNED' });
  });

  it('returns user and token on successful login', async () => {
    const hash = await bcrypt.hash('correct-password', 10);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...mockUser, passwordHash: hash } as any);

    const result = await authService.login({
      email: 'test@example.com',
      password: 'correct-password',
    });

    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe('test@example.com');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('token contains userId in payload', async () => {
    const hash = await bcrypt.hash('password', 10);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...mockUser, passwordHash: hash } as any);

    const { token } = await authService.login({ email: 'test@example.com', password: 'password' });
    const payload = jwt.decode(token) as any;

    expect(payload.userId).toBe('user-1');
  });
});

describe('auth.service — adminLogin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 401 for non-admin user', async () => {
    const hash = await bcrypt.hash('password', 10);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser, isAdmin: false, passwordHash: hash,
    } as any);

    await expect(
      authService.adminLogin({ email: 'test@example.com', password: 'password' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 when user is not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await expect(
      authService.adminLogin({ email: 'nobody@example.com', password: 'pass' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('returns token for valid admin credentials', async () => {
    const hash = await bcrypt.hash('adminpass', 10);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...mockUser, isAdmin: true, passwordHash: hash,
    } as any);

    const result = await authService.adminLogin({
      email: 'test@example.com',
      password: 'adminpass',
    });

    expect(result.token).toBeTruthy();
    expect(result.user.isAdmin).toBe(true);
  });
});

describe('auth.service — forgotPassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns success message even when email does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await authService.forgotPassword({ email: 'nobody@example.com' });

    expect(result.message).toBeTruthy();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('sets reset token on user when email exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    await authService.forgotPassword({ email: 'test@example.com' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordResetToken: expect.any(String),
          passwordResetExpires: expect.any(Date),
        }),
      })
    );
  });
});

describe('auth.service — resetPassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 400 INVALID_RESET_TOKEN when token is invalid', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    await expect(
      authService.resetPassword({ token: 'invalid-token', password: 'newpassword' })
    ).rejects.toMatchObject({ code: 'INVALID_RESET_TOKEN' });
  });

  it('updates password hash and clears reset token on success', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ ...mockUser, id: 'user-1' } as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    await authService.resetPassword({ token: 'valid-token', password: 'newSecurePass' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: expect.any(String),
          passwordResetToken: null,
          passwordResetExpires: null,
        }),
      })
    );
  });
});
