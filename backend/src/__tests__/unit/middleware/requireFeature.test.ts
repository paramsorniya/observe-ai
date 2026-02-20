import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireFeature } from '../../../middleware/requireFeature.js';
import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../../types/auth.types.js';

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

function makeReq(tier: string | null = null) {
  return {
    user: tier ? { subscriptionTier: tier } : undefined,
  } as unknown as AuthenticatedRequest;
}

describe('requireFeature middleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  it('calls next() for FREE user accessing a FREE feature', () => {
    const middleware = requireFeature('request_logging');
    middleware(makeReq('FREE'), makeRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('calls next() for STARTER user accessing cost_optimization', () => {
    const middleware = requireFeature('cost_optimization');
    middleware(makeReq('STARTER'), makeRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('calls next() for PRO user accessing team_collaboration', () => {
    const middleware = requireFeature('team_collaboration');
    middleware(makeReq('PRO'), makeRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('calls next() for ENTERPRISE user accessing sso', () => {
    const middleware = requireFeature('sso');
    middleware(makeReq('ENTERPRISE'), makeRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 403 FEATURE_LOCKED for FREE user accessing cost_optimization', () => {
    const middleware = requireFeature('cost_optimization');
    const res = makeRes();
    middleware(makeReq('FREE'), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'FEATURE_LOCKED', feature: 'cost_optimization' })
    );
  });

  it('returns 403 FEATURE_LOCKED for STARTER user accessing team_collaboration', () => {
    const middleware = requireFeature('team_collaboration');
    const res = makeRes();
    middleware(makeReq('STARTER'), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'FEATURE_LOCKED', requiredPlan: 'PRO' })
    );
  });

  it('returns 403 FEATURE_LOCKED for PRO user accessing sso', () => {
    const middleware = requireFeature('sso');
    const res = makeRes();
    middleware(makeReq('PRO'), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'FEATURE_LOCKED', requiredPlan: 'ENTERPRISE' })
    );
  });

  it('returns 401 when req.user is undefined', () => {
    const middleware = requireFeature('request_logging');
    const res = makeRes();
    middleware(makeReq(null), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'UNAUTHORIZED' })
    );
  });

  it('includes feature name in 403 response', () => {
    const middleware = requireFeature('tool_tracking');
    const res = makeRes();
    middleware(makeReq('FREE'), res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ feature: 'tool_tracking' })
    );
  });

  it('ENTERPRISE can access all features', () => {
    const features = [
      'request_logging', 'cost_optimization', 'tool_tracking',
      'team_collaboration', 'advanced_analytics', 'webhooks', 'sso',
    ];
    for (const feature of features) {
      const localNext = vi.fn();
      requireFeature(feature)(makeReq('ENTERPRISE'), makeRes(), localNext);
      expect(localNext, `ENTERPRISE should access ${feature}`).toHaveBeenCalledOnce();
    }
  });
});
