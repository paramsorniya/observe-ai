import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateApiKey } from '../../../middleware/validateApiKey.js';
import { prisma } from '../../mocks/prisma.js';
import type { Response, NextFunction } from 'express';
import type { ApiKeyRequest } from '../../../middleware/validateApiKey.js';

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

function makeReq(apiKey?: string): ApiKeyRequest {
  return {
    headers: apiKey ? { 'x-api-key': apiKey } : {},
    body: {},
  } as unknown as ApiKeyRequest;
}

const mockUser = {
  id: 'user-1',
  email: 'owner@example.com',
  isBanned: false,
  subscriptionStatus: 'active',
  monthlyRequestCount: 0,
  monthlyRequestLimit: 10000,
  requestResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
};

const mockProject = {
  id: 'proj-1',
  name: 'My Project',
  apiKey: 'obs_testapikey',
  isActive: true,
  user: mockUser,
};

describe('validateApiKey middleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
    vi.clearAllMocks();
  });

  it('returns 401 when x-api-key header is missing', async () => {
    const req = makeReq();
    const res = makeRes();

    await validateApiKey(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'UNAUTHORIZED', message: 'Missing API key' })
    );
  });

  it('returns 401 when API key is not found', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

    const req = makeReq('obs_invalidkey');
    const res = makeRes();

    await validateApiKey(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid API key' })
    );
  });

  it('returns 403 when project is inactive', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      ...mockProject, isActive: false,
    } as any);

    const req = makeReq('obs_testapikey');
    const res = makeRes();

    await validateApiKey(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Project is inactive' })
    );
  });

  it('returns 403 when project owner is banned', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      ...mockProject,
      user: { ...mockUser, isBanned: true },
    } as any);

    const req = makeReq('obs_testapikey');
    const res = makeRes();

    await validateApiKey(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Account is banned' })
    );
  });

  it('returns 403 when subscription is canceled', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      ...mockProject,
      user: { ...mockUser, subscriptionStatus: 'canceled' },
    } as any);

    const req = makeReq('obs_testapikey');
    const res = makeRes();

    await validateApiKey(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Subscription is canceled' })
    );
  });

  it('calls next() and sets req.project and req.projectUser for valid key', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as any);

    const req = makeReq('obs_testapikey');
    const res = makeRes();

    await validateApiKey(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.project).toEqual(mockProject);
    expect(req.projectUser).toEqual(mockUser);
  });

  it('queries project by the provided API key', async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as any);

    await validateApiKey(makeReq('obs_mykey123'), makeRes(), vi.fn());

    expect(prisma.project.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { apiKey: 'obs_mykey123' } })
    );
  });
});
