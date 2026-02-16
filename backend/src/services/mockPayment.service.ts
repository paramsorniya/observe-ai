import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { config } from '../utils/config.js';
import { AppError, NotFoundError } from '../errors/AppError.js';
import { TIER_LIMITS } from '../utils/features.js';
import type { SubscriptionTier } from '@prisma/client';

const VALID_PLANS = ['STARTER', 'PRO'];
const TIER_ORDER: SubscriptionTier[] = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

const PLAN_PRICES: Record<string, number> = {
  STARTER: 19,
  PRO: 49,
};

export async function createCheckoutSession(userId: string, plan: string) {
  const normalizedPlan = plan.toUpperCase();
  if (!VALID_PLANS.includes(normalizedPlan)) {
    throw new AppError('Invalid plan', 400, 'INVALID_PLAN');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  const token = jwt.sign({ userId, plan: normalizedPlan }, config.JWT_SECRET, {
    expiresIn: '1h',
  });

  const url = `${config.FRONTEND_URL}/dashboard/mock-checkout?plan=${normalizedPlan}&token=${token}`;
  return { url };
}

export async function createPortalSession(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  const url = `${config.FRONTEND_URL}/dashboard/mock-portal`;
  return { url };
}

export async function confirmMockPayment(userId: string, token: string) {
  // Validate token
  let payload: { userId: string; plan: SubscriptionTier };
  try {
    payload = jwt.verify(token, config.JWT_SECRET) as typeof payload;
  } catch {
    throw new AppError('Invalid or expired payment token', 400, 'INVALID_TOKEN');
  }

  if (payload.userId !== userId) {
    throw new AppError('Token does not match authenticated user', 403, 'TOKEN_MISMATCH');
  }

  const plan = payload.plan;
  const limits = TIER_LIMITS[plan];
  if (!limits) {
    throw new AppError('Invalid plan in token', 400, 'INVALID_PLAN');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: plan,
        subscriptionStatus: 'active',
        stripeSubscriptionId: `mock_sub_${Date.now()}`,
        monthlyRequestLimit: limits.requests,
        projectLimit: limits.projects,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        pendingDowngrade: false,
        downgradeDate: null,
        downgradeTo: null,
      },
    }),
    prisma.subscriptionHistory.create({
      data: {
        userId,
        event: 'upgraded',
        oldTier: user.subscriptionTier,
        newTier: plan,
        reason: 'Mock checkout completed',
      },
    }),
    prisma.invoice.create({
      data: {
        userId,
        stripeInvoiceId: `mock_inv_${Date.now()}`,
        stripePaymentIntentId: `mock_pi_${Date.now()}`,
        amount: PLAN_PRICES[plan] ?? 0,
        currency: 'usd',
        status: 'paid',
        paidAt: new Date(),
      },
    }),
  ]);

  return { success: true, plan };
}

export async function requestDowngrade(
  userId: string,
  targetTier: SubscriptionTier,
  projectsToKeep?: string[]
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  const currentIdx = TIER_ORDER.indexOf(user.subscriptionTier);
  const targetIdx = TIER_ORDER.indexOf(targetTier);
  if (targetIdx >= currentIdx) {
    throw new AppError('Can only downgrade to a lower tier', 400, 'INVALID_DOWNGRADE');
  }

  if (user.pendingDowngrade) {
    throw new AppError(
      'A downgrade is already pending. Cancel it first to request a new one.',
      400,
      'DOWNGRADE_ALREADY_PENDING'
    );
  }

  const targetLimits = TIER_LIMITS[targetTier];
  if (projectsToKeep && projectsToKeep.length > 0) {
    if (projectsToKeep.length > targetLimits.projects) {
      throw new AppError(
        `Target tier allows max ${targetLimits.projects} projects`,
        400,
        'TOO_MANY_PROJECTS'
      );
    }
    const ownedProjects = await prisma.project.findMany({
      where: { userId, id: { in: projectsToKeep } },
      select: { id: true },
    });
    if (ownedProjects.length !== projectsToKeep.length) {
      throw new AppError(
        'Some projectsToKeep IDs do not belong to this user',
        400,
        'INVALID_PROJECTS'
      );
    }
  }

  // Mock: downgrade date is 30 days from now (no Stripe subscription to query)
  const downgradeDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        pendingDowngrade: true,
        downgradeDate,
        downgradeTo: targetTier,
        projectsToKeep: projectsToKeep ?? Prisma.DbNull,
      },
    }),
    prisma.subscriptionHistory.create({
      data: {
        userId,
        event: 'downgrade_requested',
        oldTier: user.subscriptionTier,
        newTier: targetTier,
        reason: 'User requested downgrade (mock)',
        metadata: { downgradeDate: downgradeDate.toISOString(), projectsToKeep },
      },
    }),
  ]);

  return { downgradeDate, targetTier };
}

export async function cancelDowngrade(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  if (!user.pendingDowngrade) {
    throw new AppError('No pending downgrade to cancel', 400, 'NO_PENDING_DOWNGRADE');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        pendingDowngrade: false,
        downgradeDate: null,
        downgradeTo: null,
        projectsToKeep: Prisma.DbNull,
      },
    }),
    prisma.subscriptionHistory.create({
      data: {
        userId,
        event: 'downgrade_canceled',
        oldTier: user.subscriptionTier,
        reason: 'User canceled pending downgrade (mock)',
      },
    }),
  ]);

  return { message: 'Downgrade canceled successfully' };
}
