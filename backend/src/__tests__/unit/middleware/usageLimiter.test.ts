import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usageLimiter } from '../../../middleware/usageLimiter.js';
import { prisma } from '../../mocks/prisma.js';
import type { Response, NextFunction } from 'express';
import type { ApiKeyRequest } from '../../../middleware/validateApiKey.js';

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

function makeReq(overrides: Partial<{
  projectUser: object;
  body: object;
}>= {}): ApiKeyRequest {
  return {
    projectUser: overrides.projectUser ?? null,
    body: overrides.body ?? {},
  } as unknown as ApiKeyRequest;
}

const futureResetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const pastResetDate = new Date(Date.now() - 1000);

function makeUser(overrides = {}) {
  return {
    id: 'user-1',
    monthlyRequestCount: 0,
    monthlyRequestLimit: 10000,
    apiCallsThisMonth: 0,
    freeLimitHitCount: 0,
    requestResetDate: futureResetDate,
    ...overrides,
  };
}

describe('usageLimiter middleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
    vi.clearAllMocks();
  });

  it('returns 500 when projectUser is not set', async () => {
    const req = makeReq({ projectUser: null });
    const res = makeRes();

    await usageLimiter(req as any, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('calls next() when usage is within limit', async () => {
    const req = makeReq({
      projectUser: makeUser({ monthlyRequestCount: 5000 }),
      body: { requests: [{}] },
    });

    await usageLimiter(req, makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 429 USAGE_LIMIT when usage exceeds limit', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = makeReq({
      projectUser: makeUser({ monthlyRequestCount: 10000, monthlyRequestLimit: 10000 }),
      body: { requests: [{}] },
    });
    const res = makeRes();

    await usageLimiter(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'USAGE_LIMIT',
        limit: 10000,
        used: 10000,
        remaining: 0,
      })
    );
  });

  it('increments freeLimitHitCount when limit is exceeded', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = makeReq({
      projectUser: makeUser({ monthlyRequestCount: 10000, monthlyRequestLimit: 10000 }),
      body: { requests: [{}] },
    });

    await usageLimiter(req, makeRes(), next);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { freeLimitHitCount: { increment: 1 } },
      })
    );
  });

  it('accounts for batch size when checking limit', async () => {
    // 3 requests in batch, only 2 slots left → should reject
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const req = makeReq({
      projectUser: makeUser({ monthlyRequestCount: 9999, monthlyRequestLimit: 10000 }),
      body: { requests: [{}, {}, {}] },
    });
    const res = makeRes();

    await usageLimiter(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('allows batch when count + batchSize <= limit', async () => {
    const req = makeReq({
      projectUser: makeUser({ monthlyRequestCount: 9997, monthlyRequestLimit: 10000 }),
      body: { requests: [{}, {}, {}] },
    });

    await usageLimiter(req, makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('resets monthly counter when reset date has passed', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    const user = makeUser({
      monthlyRequestCount: 5000,
      requestResetDate: pastResetDate,
    });
    const req = makeReq({
      projectUser: user,
      body: { requests: [{}] },
    });

    await usageLimiter(req, makeRes(), next);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          monthlyRequestCount: 0,
          apiCallsThisMonth: 0,
        }),
      })
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it('calls next() when usage is 0 and single request', async () => {
    const req = makeReq({
      projectUser: makeUser({ monthlyRequestCount: 0 }),
      body: { requests: [{}] },
    });

    await usageLimiter(req, makeRes(), next);

    expect(next).toHaveBeenCalledOnce();
  });
});
