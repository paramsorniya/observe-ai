import type { Response, NextFunction } from 'express';
import type { ApiKeyRequest } from './validateApiKey.js';
import { prisma } from '../utils/prisma.js';

export async function usageLimiter(
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = req.projectUser;
  if (!user) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'User not found' });
    return;
  }

  // Check if counter needs reset (monthly)
  const now = new Date();
  if (now >= new Date(user.requestResetDate)) {
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        monthlyRequestCount: 0,
        requestResetDate: nextReset,
      },
    });
    user.monthlyRequestCount = 0;
  }

  // Check limit
  const batchSize = Array.isArray(req.body?.requests) ? req.body.requests.length : 1;

  if (user.monthlyRequestCount + batchSize > user.monthlyRequestLimit) {
    const remaining = Math.max(0, user.monthlyRequestLimit - user.monthlyRequestCount);
    res.status(429).json({
      error: 'USAGE_LIMIT',
      message: 'Monthly request limit exceeded',
      limit: user.monthlyRequestLimit,
      used: user.monthlyRequestCount,
      remaining,
    });
    return;
  }

  next();
}
