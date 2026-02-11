import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { NotFoundError } from '../errors/AppError.js';
import { TIER_LIMITS } from '../utils/features.js';
import type { SubscriptionTier } from '@prisma/client';

export const userListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  tier: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.enum(['createdAt', 'lastActiveAt', 'email', 'monthlyRequestCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function getUsers(query: z.infer<typeof userListSchema>) {
  const where: any = { isAdmin: false };

  if (query.search) {
    where.OR = [
      { email: { contains: query.search, mode: 'insensitive' } },
      { name: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.tier) where.subscriptionTier = query.tier;
  if (query.status) where.subscriptionStatus = query.status;

  const skip = (query.page - 1) * query.limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortOrder },
      skip,
      take: query.limit,
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        monthlyRequestCount: true,
        monthlyRequestLimit: true,
        isBanned: true,
        createdAt: true,
        lastActiveAt: true,
        _count: { select: { projects: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  };
}

export async function getUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      projects: { include: { _count: { select: { requests: true } } } },
      subscriptionHistory: { orderBy: { timestamp: 'desc' }, take: 10 },
      invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!user) throw new NotFoundError('User not found');

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function banUser(userId: string, reason?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  return prisma.user.update({
    where: { id: userId },
    data: { isBanned: true, bannedAt: new Date(), bannedReason: reason || 'Banned by admin' },
  });
}

export async function unbanUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { isBanned: false, bannedAt: null, bannedReason: null },
  });
}

export async function deleteUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');
  await prisma.user.delete({ where: { id: userId } });
}

export async function overrideSubscription(userId: string, tier: SubscriptionTier) {
  const limits = TIER_LIMITS[tier];
  return prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        monthlyRequestLimit: limits.requests,
        projectLimit: limits.projects,
      },
    }),
    prisma.subscriptionHistory.create({
      data: { userId, event: 'upgraded', newTier: tier, reason: 'Admin override' },
    }),
  ]);
}

export async function getAdminDashboard() {
  const [totalUsers, tierCounts, activeSubscriptions, totalRequests, recentUsers] = await Promise.all([
    prisma.user.count({ where: { isAdmin: false } }),
    prisma.user.groupBy({
      by: ['subscriptionTier'],
      where: { isAdmin: false },
      _count: true,
    }),
    prisma.user.count({ where: { subscriptionTier: { not: 'FREE' }, subscriptionStatus: 'active' } }),
    prisma.request.count(),
    prisma.user.findMany({
      where: { isAdmin: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, email: true, name: true, subscriptionTier: true, createdAt: true },
    }),
  ]);

  // Estimate MRR
  const mrr = tierCounts.reduce((sum, t) => {
    const prices: Record<string, number> = { FREE: 0, STARTER: 19, PRO: 49, ENTERPRISE: 99 };
    return sum + (prices[t.subscriptionTier] || 0) * t._count;
  }, 0);

  return {
    totalUsers,
    activeSubscriptions,
    totalRequests,
    mrr,
    tierBreakdown: tierCounts.map((t) => ({ tier: t.subscriptionTier, count: t._count })),
    recentUsers,
  };
}

export async function getRevenueStats() {
  const invoices = await prisma.invoice.findMany({
    where: { status: 'paid' },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });

  const monthlyRevenue: Record<string, number> = {};
  for (const inv of invoices) {
    const month = inv.createdAt.toISOString().slice(0, 7);
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(inv.amount);
  }

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

  return {
    totalRevenue,
    monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue })),
    invoiceCount: invoices.length,
  };
}

export async function getSystemStats() {
  const [totalRequests, modelDistribution, errorRate, recentVolume] = await Promise.all([
    prisma.request.count(),
    prisma.request.groupBy({
      by: ['model'],
      _count: true,
      orderBy: { _count: { model: 'desc' } },
      take: 10,
    }),
    prisma.request.count({ where: { status: 'error' } }),
    prisma.request.count({
      where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return {
    totalRequests,
    requestsLast24h: recentVolume,
    errorRate: totalRequests > 0 ? (errorRate / totalRequests) * 100 : 0,
    modelDistribution: modelDistribution.map((m) => ({ model: m.model, count: m._count })),
  };
}
