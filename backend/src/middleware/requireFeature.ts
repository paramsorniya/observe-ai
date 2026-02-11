import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/auth.types.js';
import { canAccessFeature, getMinimumTier } from '../utils/features.js';

export function requireFeature(feature: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
      return;
    }

    if (!canAccessFeature(req.user.subscriptionTier, feature)) {
      res.status(403).json({
        error: 'FEATURE_LOCKED',
        message: `This feature requires a ${getMinimumTier(feature)} plan or higher`,
        requiredPlan: getMinimumTier(feature),
        feature,
      });
      return;
    }

    next();
  };
}
