import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAdmin } from '../../../middleware/requireAdmin.js';
import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../../types/auth.types.js';

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('requireAdmin middleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  it('calls next() when user is admin', () => {
    const req = { user: { isAdmin: true } } as unknown as AuthenticatedRequest;
    const res = makeRes();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when user is not admin', () => {
    const req = { user: { isAdmin: false } } as unknown as AuthenticatedRequest;
    const res = makeRes();

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'FORBIDDEN' })
    );
  });

  it('returns 403 when req.user is undefined', () => {
    const req = {} as unknown as AuthenticatedRequest;
    const res = makeRes();

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 403 when req.user is null', () => {
    const req = { user: null } as unknown as AuthenticatedRequest;
    const res = makeRes();

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
