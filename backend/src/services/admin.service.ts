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
        currentPeriodEnd: true,
        pendingDowngrade: true,
        downgradeDate: true,
        downgradeTo: true,
        paymentFailedAt: true,
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

export async function overrideSubscription(userId: string, tier: SubscriptionTier, reason?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  const limits = TIER_LIMITS[tier];
  const TIER_ORDER: SubscriptionTier[] = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
  const oldIdx = TIER_ORDER.indexOf(user.subscriptionTier);
  const newIdx = TIER_ORDER.indexOf(tier);
  const event = newIdx > oldIdx ? 'upgraded' : newIdx < oldIdx ? 'downgraded' : 'updated';

  const currentPeriodEnd = tier === 'FREE' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const PLAN_PRICES: Record<string, number> = { FREE: 0, STARTER: 19, PRO: 49, ENTERPRISE: 99 };

  const operations: any[] = [
    prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        monthlyRequestLimit: limits.requests,
        projectLimit: limits.projects,
        currentPeriodEnd,
        pendingDowngrade: false,
        downgradeDate: null,
        downgradeTo: null,
        paymentFailedAt: null,
      },
    }),
    prisma.subscriptionHistory.create({
      data: {
        userId,
        event,
        oldTier: user.subscriptionTier,
        newTier: tier,
        reason: reason || 'Admin override',
        metadata: { adminAction: true, previousStatus: user.subscriptionStatus },
      },
    }),
  ];

  // Create invoice entry for accounting when upgrading to a paid tier
  if (tier !== 'FREE' && PLAN_PRICES[tier] > 0) {
    operations.push(
      prisma.invoice.create({
        data: {
          userId,
          stripeInvoiceId: `admin_override_${Date.now()}`,
          amount: PLAN_PRICES[tier],
          currency: 'usd',
          status: 'paid',
          paidAt: new Date(),
        },
      })
    );
  }

  return prisma.$transaction(operations);
}

const PLAN_PRICES: Record<string, number> = { FREE: 0, STARTER: 19, PRO: 49, ENTERPRISE: 99 };

export async function getAdminDashboard() {
  const [
    totalUsers,
    tierCounts,
    statusCounts,
    pastDueUsers,
    pendingDowngradeCount,
    totalRequests,
    recentUsers,
    recentEvents,
    newUsersThisMonth,
    newUsersLastMonth,
  ] = await Promise.all([
    prisma.user.count({ where: { isAdmin: false } }),
    prisma.user.groupBy({
      by: ['subscriptionTier'],
      where: { isAdmin: false },
      _count: true,
    }),
    prisma.user.groupBy({
      by: ['subscriptionStatus'],
      where: { isAdmin: false },
      _count: true,
    }),
    prisma.user.count({ where: { subscriptionStatus: 'past_due', isAdmin: false } }),
    prisma.user.count({ where: { pendingDowngrade: true, isAdmin: false } }),
    prisma.request.count(),
    prisma.user.findMany({
      where: { isAdmin: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, email: true, name: true, subscriptionTier: true, createdAt: true },
    }),
    prisma.subscriptionHistory.findMany({
      orderBy: { timestamp: 'desc' },
      take: 15,
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.user.count({
      where: {
        isAdmin: false,
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.user.count({
      where: {
        isAdmin: false,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ]);

  const tierMap: Record<string, number> = {};
  for (const t of tierCounts) tierMap[t.subscriptionTier] = t._count;

  const freeUsers = tierMap['FREE'] || 0;
  const paidUsers = totalUsers - freeUsers;

  const mrr = tierCounts.reduce((sum, t) => {
    return sum + (PLAN_PRICES[t.subscriptionTier] || 0) * t._count;
  }, 0);

  const arr = mrr * 12;
  const arpu = paidUsers > 0 ? mrr / paidUsers : 0;
  const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0;

  const statusMap: Record<string, number> = {};
  for (const s of statusCounts) statusMap[s.subscriptionStatus] = s._count;

  return {
    totalUsers,
    freeUsers,
    paidUsers,
    mrr,
    arr,
    arpu: Math.round(arpu * 100) / 100,
    conversionRate: Math.round(conversionRate * 100) / 100,
    totalRequests,
    pastDueUsers,
    pendingDowngradeCount,
    statusBreakdown: statusMap,
    tierBreakdown: tierCounts.map((t) => ({ tier: t.subscriptionTier, count: t._count })),
    recentUsers,
    recentEvents: recentEvents.map((e) => ({
      id: e.id,
      event: e.event,
      oldTier: e.oldTier,
      newTier: e.newTier,
      reason: e.reason,
      metadata: e.metadata,
      timestamp: e.timestamp,
      userEmail: e.user.email,
      userName: e.user.name,
    })),
    newUsersThisMonth,
    newUsersLastMonth,
  };
}

export async function getRevenueStats() {
  const [invoices, tierCounts, recentInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: 'paid' },
      orderBy: { createdAt: 'desc' },
      take: 2000,
      select: { stripeInvoiceId: true, amount: true, createdAt: true },
    }),
    prisma.user.groupBy({
      by: ['subscriptionTier'],
      where: { isAdmin: false, subscriptionTier: { not: 'FREE' } },
      _count: true,
    }),
    prisma.invoice.findMany({
      where: { status: 'paid' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { email: true, name: true, subscriptionTier: true } } },
    }),
  ]);

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

  // Monthly revenue timeline
  const monthlyRevenue: Record<string, number> = {};
  for (const inv of invoices) {
    const month = inv.createdAt.toISOString().slice(0, 7);
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(inv.amount);
  }

  // Revenue by source (admin override, mock, stripe)
  let adminRevenue = 0;
  let mockRevenue = 0;
  let stripeRevenue = 0;
  for (const inv of invoices) {
    const amount = Number(inv.amount);
    if (inv.stripeInvoiceId.startsWith('admin_override')) adminRevenue += amount;
    else if (inv.stripeInvoiceId.startsWith('mock_inv')) mockRevenue += amount;
    else stripeRevenue += amount;
  }

  // MRR by tier
  const mrrByTier = tierCounts.map((t) => ({
    tier: t.subscriptionTier,
    count: t._count,
    mrr: (PLAN_PRICES[t.subscriptionTier] || 0) * t._count,
  }));
  const totalMrr = mrrByTier.reduce((sum, t) => sum + t.mrr, 0);
  const paidUsers = tierCounts.reduce((sum, t) => sum + t._count, 0);
  const arpu = paidUsers > 0 ? totalMrr / paidUsers : 0;

  return {
    totalRevenue,
    mrr: totalMrr,
    arr: totalMrr * 12,
    arpu: Math.round(arpu * 100) / 100,
    invoiceCount: invoices.length,
    monthlyRevenue: Object.entries(monthlyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue })),
    revenueBySource: { stripe: stripeRevenue, admin: adminRevenue, mock: mockRevenue },
    mrrByTier,
    recentInvoices: recentInvoices.map((inv) => ({
      id: inv.id,
      amount: Number(inv.amount),
      currency: inv.currency,
      status: inv.status,
      source: inv.stripeInvoiceId.startsWith('admin_override') ? 'admin'
        : inv.stripeInvoiceId.startsWith('mock_inv') ? 'mock'
        : 'stripe',
      paidAt: inv.paidAt,
      createdAt: inv.createdAt,
      userEmail: inv.user.email,
      userName: inv.user.name,
      userTier: inv.user.subscriptionTier,
    })),
  };
}

export async function getSubscriptionAnalytics() {
  const [
    tierCounts,
    statusCounts,
    pastDueUsers,
    pendingDowngrades,
    recentEvents,
  ] = await Promise.all([
    prisma.user.groupBy({
      by: ['subscriptionTier'],
      where: { isAdmin: false },
      _count: true,
    }),
    prisma.user.groupBy({
      by: ['subscriptionStatus'],
      where: { isAdmin: false, subscriptionTier: { not: 'FREE' } },
      _count: true,
    }),
    prisma.user.findMany({
      where: { subscriptionStatus: 'past_due', isAdmin: false },
      select: {
        id: true, email: true, name: true, subscriptionTier: true,
        paymentFailedAt: true, currentPeriodEnd: true,
      },
      orderBy: { paymentFailedAt: 'asc' },
    }),
    prisma.user.findMany({
      where: { pendingDowngrade: true, isAdmin: false },
      select: {
        id: true, email: true, name: true, subscriptionTier: true,
        downgradeTo: true, downgradeDate: true,
      },
      orderBy: { downgradeDate: 'asc' },
    }),
    prisma.subscriptionHistory.findMany({
      orderBy: { timestamp: 'desc' },
      take: 30,
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  const tierMap: Record<string, number> = {};
  for (const t of tierCounts) tierMap[t.subscriptionTier] = t._count;

  const statusMap: Record<string, number> = {};
  for (const s of statusCounts) statusMap[s.subscriptionStatus] = s._count;

  const totalPaid = Object.entries(tierMap)
    .filter(([tier]) => tier !== 'FREE')
    .reduce((sum, [, count]) => sum + count, 0);

  return {
    tierBreakdown: tierMap,
    paidStatusBreakdown: statusMap,
    totalFree: tierMap['FREE'] || 0,
    totalPaid,
    atRiskUsers: pastDueUsers,
    pendingDowngrades,
    recentEvents: recentEvents.map((e) => ({
      id: e.id,
      event: e.event,
      oldTier: e.oldTier,
      newTier: e.newTier,
      reason: e.reason,
      metadata: e.metadata as any,
      timestamp: e.timestamp,
      userEmail: e.user.email,
      userName: e.user.name,
    })),
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
