import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../../middleware/authenticate.js';
import { prisma } from '../../mocks/prisma.js';
import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../../types/auth.types.js';

const TEST_SECRET = 'test-jwt-secret-key-for-testing';

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

function makeReq(authHeader?: string): AuthenticatedRequest {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as AuthenticatedRequest;
}

function signToken(payload: object, expiresIn = '7d') {
  return jwt.sign(payload, TEST_SECRET, { expiresIn });
}

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  isAdmin: false,
  isBanned: false,
  subscriptionTier: 'FREE',
};

describe('authenticate middleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const req = makeReq();
    const res = makeRes();

    await authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'UNAUTHORIZED' })
    );
  });

  it('returns 401 when Authorization header does not start with Bearer', async () => {
    const req = makeReq('Token abc123');
    const res = makeRes();

    await authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 for invalid/malformed JWT', async () => {
    const req = makeReq('Bearer not-a-valid-jwt');
    const res = makeRes();

    await authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'UNAUTHORIZED', message: 'Invalid or expired token' })
    );
  });

  it('returns 401 for expired JWT', async () => {
    const token = signToken({ userId: 'user-1', isAdmin: false }, '-1s');
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();

    await authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when user is not found in DB', async () => {
    const token = signToken({ userId: 'nonexistent-user', isAdmin: false });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();

    await authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'User not found' })
    );
  });

  it('returns 403 when user is banned', async () => {
    const token = signToken({ userId: 'user-1', isAdmin: false });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...mockUser, isBanned: true } as any);

    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();

    await authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'FORBIDDEN', message: 'Account is banned' })
    );
  });

  it('calls next() and sets req.user and req.userId for valid token and active user', async () => {
    const token = signToken({ userId: 'user-1', isAdmin: false });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual(mockUser);
    expect(req.userId).toBe('user-1');
  });

  it('looks up user by the userId from JWT payload', async () => {
    const token = signToken({ userId: 'user-abc', isAdmin: false });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ ...mockUser, id: 'user-abc' } as any);
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    const req = makeReq(`Bearer ${token}`);
    await authenticate(req, makeRes(), vi.fn());

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-abc' } })
    );
  });
});
