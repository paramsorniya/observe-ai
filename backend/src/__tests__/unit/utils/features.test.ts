import { describe, it, expect } from 'vitest';
import { canAccessFeature, getMinimumTier, FEATURE_MATRIX, TIER_LIMITS } from '../../../utils/features.js';

describe('canAccessFeature', () => {
  describe('FREE tier', () => {
    it('can access request_logging', () => {
      expect(canAccessFeature('FREE', 'request_logging')).toBe(true);
    });

    it('can access cost_tracking_basic', () => {
      expect(canAccessFeature('FREE', 'cost_tracking_basic')).toBe(true);
    });

    it('can access error_monitoring', () => {
      expect(canAccessFeature('FREE', 'error_monitoring')).toBe(true);
    });

    it('cannot access cost_optimization', () => {
      expect(canAccessFeature('FREE', 'cost_optimization')).toBe(false);
    });

    it('cannot access tool_tracking', () => {
      expect(canAccessFeature('FREE', 'tool_tracking')).toBe(false);
    });

    it('cannot access team_collaboration', () => {
      expect(canAccessFeature('FREE', 'team_collaboration')).toBe(false);
    });

    it('cannot access advanced_analytics', () => {
      expect(canAccessFeature('FREE', 'advanced_analytics')).toBe(false);
    });

    it('cannot access sso', () => {
      expect(canAccessFeature('FREE', 'sso')).toBe(false);
    });
  });

  describe('STARTER tier', () => {
    it('can access cost_optimization', () => {
      expect(canAccessFeature('STARTER', 'cost_optimization')).toBe(true);
    });

    it('can access tool_tracking', () => {
      expect(canAccessFeature('STARTER', 'tool_tracking')).toBe(true);
    });

    it('can access export_csv', () => {
      expect(canAccessFeature('STARTER', 'export_csv')).toBe(true);
    });

    it('cannot access team_collaboration', () => {
      expect(canAccessFeature('STARTER', 'team_collaboration')).toBe(false);
    });

    it('cannot access advanced_analytics', () => {
      expect(canAccessFeature('STARTER', 'advanced_analytics')).toBe(false);
    });

    it('cannot access sso', () => {
      expect(canAccessFeature('STARTER', 'sso')).toBe(false);
    });
  });

  describe('PRO tier', () => {
    it('can access team_collaboration', () => {
      expect(canAccessFeature('PRO', 'team_collaboration')).toBe(true);
    });

    it('can access advanced_analytics', () => {
      expect(canAccessFeature('PRO', 'advanced_analytics')).toBe(true);
    });

    it('can access webhooks', () => {
      expect(canAccessFeature('PRO', 'webhooks')).toBe(true);
    });

    it('cannot access sso', () => {
      expect(canAccessFeature('PRO', 'sso')).toBe(false);
    });
  });

  describe('ENTERPRISE tier', () => {
    it('can access all features including sso', () => {
      for (const feature of Object.keys(FEATURE_MATRIX)) {
        expect(canAccessFeature('ENTERPRISE', feature), `should access ${feature}`).toBe(true);
      }
    });
  });

  it('returns false for unknown feature', () => {
    expect(canAccessFeature('PRO', 'nonexistent_feature')).toBe(false);
  });
});

describe('getMinimumTier', () => {
  it('returns FREE for request_logging', () => {
    expect(getMinimumTier('request_logging')).toBe('FREE');
  });

  it('returns STARTER for cost_optimization', () => {
    expect(getMinimumTier('cost_optimization')).toBe('STARTER');
  });

  it('returns PRO for team_collaboration', () => {
    expect(getMinimumTier('team_collaboration')).toBe('PRO');
  });

  it('returns PRO for advanced_analytics', () => {
    expect(getMinimumTier('advanced_analytics')).toBe('PRO');
  });

  it('returns ENTERPRISE for sso', () => {
    expect(getMinimumTier('sso')).toBe('ENTERPRISE');
  });

  it('returns null for unknown feature', () => {
    expect(getMinimumTier('unknown_feature')).toBeNull();
  });
});

describe('TIER_LIMITS', () => {
  it('FREE has 10k request limit', () => {
    expect(TIER_LIMITS.FREE.requests).toBe(10000);
  });

  it('FREE has 1 project limit', () => {
    expect(TIER_LIMITS.FREE.projects).toBe(1);
  });

  it('STARTER has 100k request limit', () => {
    expect(TIER_LIMITS.STARTER.requests).toBe(100000);
  });

  it('PRO has 1M request limit', () => {
    expect(TIER_LIMITS.PRO.requests).toBe(1000000);
  });

  it('retention days increase with tier', () => {
    expect(TIER_LIMITS.FREE.retentionDays).toBeLessThan(TIER_LIMITS.STARTER.retentionDays);
    expect(TIER_LIMITS.STARTER.retentionDays).toBeLessThan(TIER_LIMITS.PRO.retentionDays);
    expect(TIER_LIMITS.PRO.retentionDays).toBeLessThan(TIER_LIMITS.ENTERPRISE.retentionDays);
  });

  it('all tiers have positive values', () => {
    for (const [tier, limits] of Object.entries(TIER_LIMITS)) {
      expect(limits.requests, `${tier}.requests`).toBeGreaterThan(0);
      expect(limits.projects, `${tier}.projects`).toBeGreaterThan(0);
      expect(limits.retentionDays, `${tier}.retentionDays`).toBeGreaterThan(0);
      expect(limits.teamMembers, `${tier}.teamMembers`).toBeGreaterThan(0);
    }
  });
});
