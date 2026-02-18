import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { NotFoundError } from '../errors/AppError.js';
import { TIER_LIMITS } from '../utils/features.js';
import type { SubscriptionTier, Prisma } from '@prisma/client';

/* ─── Schemas ─── */

export const invoiceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  search: z.string().optional(),
  source: z.enum(['stripe', 'admin', 'comp']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const subscriptionEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  search: z.string().optional(),
  event: z.string().optional(),
});

export const userListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  // Core filters
  userStatus: z.string().optional(),            // ghost | integrated | active | dormant | churned
  tier: z.string().optional(),                  // FREE | STARTER | PRO | ENTERPRISE
  planFilter: z.string().optional(),            // free | any_paid | was_paid_now_free | currently_paid
  // Date filters
  registeredAfter: z.string().optional(),
  registeredBefore: z.string().optional(),
  // Activity filters
  activityFilter: z.string().optional(),        // active_7d | active_30d | never_active
  // Limit hit filters
  limitHitFilter: z.string().optional(),        // hit_1 | hit_3 | never
  // Plan history filters
  planHistoryFilter: z.string().optional(),     // free_never_upgraded | was_paid_now_free | currently_paid | upgraded_last_30d
  // Segment shortcut
  segment: z.string().optional(),
  // Tag filter
  tag: z.string().optional(),
  // Sorting
  sortBy: z.enum([
    'createdAt', 'lastApiCallAt', 'email', 'monthlyRequestCount',
    'firstApiCallAt', 'apiCallsThisMonth', 'freeLimitHitCount',
    'totalApiCallsLifetime', 'lastActiveAt',
  ]).default('lastApiCallAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/* ─── Segment shortcut definitions ─── */

function applySegment(segment: string): Partial<z.infer<typeof userListSchema>> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  switch (segment) {
    case 'hot_upgrade_leads':
      return { tier: 'FREE', activityFilter: 'active_7d', limitHitFilter: 'hit_1' };
    case 'ghosts':
      return { userStatus: 'ghost', registeredBefore: sevenDaysAgo.toISOString() };
    case 'win_back':
      return { planHistoryFilter: 'was_paid_now_free' };
    case 'new_this_month':
      return { registeredAfter: startOfMonth.toISOString() };
    case 'new_active':
      return { registeredAfter: startOfMonth.toISOString(), activityFilter: 'never_active' }; // overridden below
    case 'long_term_free':
      return { tier: 'FREE', activityFilter: 'active_7d' };
    case 'going_dormant':
      return { userStatus: 'integrated' }; // 7-14 day warning zone
    default:
      return {};
  }
}

/* ─── Build where clause ─── */

async function buildUserWhere(query: z.infer<typeof userListSchema>): Promise<Prisma.UserWhereInput> {
  // If a segment shortcut is provided, merge its filters with explicit filters
  let effective = { ...query };
  if (query.segment) {
    const segmentFilters = applySegment(query.segment);
    effective = { ...effective, ...segmentFilters };

    // Special case: "new_active" means registered this month AND has made at least 1 API call
    if (query.segment === 'new_active') {
      effective.activityFilter = undefined; // clear override
    }

    // Special case: "long_term_free" means free for 60+ days and still active
    if (query.segment === 'long_term_free') {
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      effective.registeredBefore = sixtyDaysAgo.toISOString();
    }
  }

  const where: Prisma.UserWhereInput = { isAdmin: false };
  const AND: Prisma.UserWhereInput[] = [];

  // Search
  if (effective.search) {
    AND.push({
      OR: [
        { email: { contains: effective.search, mode: 'insensitive' } },
        { name: { contains: effective.search, mode: 'insensitive' } },
      ],
    });
  }

  // User status
  if (effective.userStatus) {
    where.userStatus = effective.userStatus as any;
  }

  // Tier
  if (effective.tier) {
    where.subscriptionTier = effective.tier as SubscriptionTier;
  }

  // Plan filter (composite)
  if (effective.planFilter) {
    switch (effective.planFilter) {
      case 'free':
        where.subscriptionTier = 'FREE';
        break;
      case 'any_paid':
        where.subscriptionTier = { not: 'FREE' };
        break;
      case 'currently_paid':
        where.subscriptionTier = { not: 'FREE' };
        where.subscriptionStatus = 'active';
        break;
      case 'was_paid_now_free':
        // Users on FREE who have a subscription history showing they were on a paid tier
        where.subscriptionTier = 'FREE';
        AND.push({
          subscriptionHistory: {
            some: {
              oldTier: { in: ['STARTER', 'PRO', 'ENTERPRISE'] },
              newTier: 'FREE',
            },
          },
        });
        break;
    }
  }

  // Registration date range
  if (effective.registeredAfter || effective.registeredBefore) {
    const createdAt: any = {};
    if (effective.registeredAfter) createdAt.gte = new Date(effective.registeredAfter);
    if (effective.registeredBefore) createdAt.lte = new Date(effective.registeredBefore);
    where.createdAt = createdAt;
  }

  // Activity filter
  if (effective.activityFilter) {
    const now = new Date();
    switch (effective.activityFilter) {
      case 'active_7d':
        where.lastApiCallAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case 'active_30d':
        where.lastApiCallAt = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case 'never_active':
        where.firstApiCallAt = null;
        break;
    }
  }

  // Special case for new_active segment: registered this month + has made API calls
  if (query.segment === 'new_active') {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    where.createdAt = { gte: startOfMonth };
    AND.push({ firstApiCallAt: { not: null } });
  }

  // Limit hit filter
  if (effective.limitHitFilter) {
    switch (effective.limitHitFilter) {
      case 'hit_1':
        where.freeLimitHitCount = { gte: 1 };
        break;
      case 'hit_3':
        where.freeLimitHitCount = { gte: 3 };
        break;
      case 'never':
        where.freeLimitHitCount = 0;
        break;
    }
  }

  // Plan history filter
  if (effective.planHistoryFilter) {
    switch (effective.planHistoryFilter) {
      case 'free_never_upgraded':
        where.subscriptionTier = 'FREE';
        AND.push({
          subscriptionHistory: {
            none: {
              newTier: { in: ['STARTER', 'PRO', 'ENTERPRISE'] },
            },
          },
        });
        break;
      case 'was_paid_now_free':
        where.subscriptionTier = 'FREE';
        AND.push({
          subscriptionHistory: {
            some: {
              oldTier: { in: ['STARTER', 'PRO', 'ENTERPRISE'] },
              newTier: 'FREE',
            },
          },
        });
        break;
      case 'currently_paid':
        where.subscriptionTier = { not: 'FREE' };
        break;
      case 'upgraded_last_30d':
        AND.push({
          subscriptionHistory: {
            some: {
              event: 'upgraded',
              timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
          },
        });
        break;
    }
  }

  // Tag filter
  if (effective.tag) {
    AND.push({
      tags: { some: { tag: effective.tag } },
    });
  }

  if (AND.length > 0) {
    where.AND = AND;
  }

  return where;
}

/* ─── Get Users (paginated) ─── */

export async function getUsers(query: z.infer<typeof userListSchema>) {
  const where = await buildUserWhere(query);
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
        userStatus: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        monthlyRequestCount: true,
        monthlyRequestLimit: true,
        apiCallsThisMonth: true,
        totalApiCallsLifetime: true,
        freeLimitHitCount: true,
        firstApiCallAt: true,
        lastApiCallAt: true,
        lastActiveAt: true,
        planStartedAt: true,
        isBanned: true,
        currentPeriodEnd: true,
        pendingDowngrade: true,
        downgradeDate: true,
        downgradeTo: true,
        paymentFailedAt: true,
        referralSource: true,
        createdAt: true,
        _count: { select: { projects: true } },
        tags: { select: { tag: true } },
        subscriptionHistory: {
          select: { id: true },
          take: 1,
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      ...u,
      tags: u.tags.map((t) => t.tag),
      hasPlanChanges: u.subscriptionHistory.length > 0,
      subscriptionHistory: undefined,
      daysSinceLastActivity: u.lastApiCallAt
        ? Math.floor((Date.now() - new Date(u.lastApiCallAt).getTime()) / (1000 * 60 * 60 * 24))
        : null,
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

/* ─── Get Users for CSV Export ─── */

export async function getUsersForExport(query: z.infer<typeof userListSchema>) {
  const where = await buildUserWhere(query);

  const users = await prisma.user.findMany({
    where,
    orderBy: { [query.sortBy]: query.sortOrder },
    select: {
      id: true,
      email: true,
      name: true,
      userStatus: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      monthlyRequestCount: true,
      monthlyRequestLimit: true,
      apiCallsThisMonth: true,
      totalApiCallsLifetime: true,
      freeLimitHitCount: true,
      firstApiCallAt: true,
      lastApiCallAt: true,
      lastActiveAt: true,
      planStartedAt: true,
      integrationCompletedAt: true,
      referralSource: true,
      createdAt: true,
      isBanned: true,
      _count: { select: { projects: true } },
      tags: { select: { tag: true } },
    },
  });

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name || '',
    user_status: u.userStatus,
    current_plan: u.subscriptionTier,
    subscription_status: u.subscriptionStatus,
    registered_at: u.createdAt.toISOString(),
    first_api_call_at: u.firstApiCallAt?.toISOString() || '',
    last_api_call_at: u.lastApiCallAt?.toISOString() || '',
    last_active_at: u.lastActiveAt.toISOString(),
    api_calls_this_month: u.apiCallsThisMonth,
    total_api_calls_lifetime: u.totalApiCallsLifetime,
    monthly_request_count: u.monthlyRequestCount,
    monthly_request_limit: u.monthlyRequestLimit,
    free_limit_hit_count: u.freeLimitHitCount,
    plan_started_at: u.planStartedAt.toISOString(),
    integration_completed_at: u.integrationCompletedAt?.toISOString() || '',
    referral_source: u.referralSource || '',
    projects_count: u._count.projects,
    is_banned: u.isBanned,
    tags: u.tags.map((t) => t.tag).join(';'),
    days_since_last_activity: u.lastApiCallAt
      ? Math.floor((Date.now() - new Date(u.lastApiCallAt).getTime()) / (1000 * 60 * 60 * 24))
      : null,
  }));
}

/* ─── Bulk Tag Users ─── */

export const bulkTagSchema = z.object({
  userIds: z.array(z.string()).min(1).max(500),
  tag: z.string().min(1).max(50),
});

export async function bulkTagUsers(data: z.infer<typeof bulkTagSchema>) {
  const { userIds, tag } = data;

  // Use createMany with skipDuplicates to avoid unique constraint errors
  await prisma.userTag.createMany({
    data: userIds.map((userId) => ({ userId, tag })),
    skipDuplicates: true,
  });

  return { tagged: userIds.length, tag };
}

/* ─── Bulk Remove Tag ─── */

export async function bulkRemoveTag(userIds: string[], tag: string) {
  await prisma.userTag.deleteMany({
    where: { userId: { in: userIds }, tag },
  });
  return { removed: userIds.length, tag };
}

/* ─── Get All Tags ─── */

export async function getAllTags() {
  const tags = await prisma.userTag.groupBy({
    by: ['tag'],
    _count: true,
    orderBy: { _count: { tag: 'desc' } },
  });
  return tags.map((t) => ({ tag: t.tag, count: t._count }));
}

/* ─── User Detail (Enhanced) ─── */

export async function getUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      projects: { include: { _count: { select: { requests: true } } } },
      subscriptionHistory: { orderBy: { timestamp: 'desc' }, take: 50 },
      invoices: { orderBy: { createdAt: 'desc' }, take: 20 },
      tags: { select: { tag: true, createdAt: true } },
    },
  });

  if (!user) throw new NotFoundError('User not found');

  // Monthly API call data (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const projectIds = user.projects.map((p) => p.id);
  let monthlyApiCalls: { month: string; count: number }[] = [];

  if (projectIds.length > 0) {
    const rawMonthly = await prisma.$queryRawUnsafe<{ month: string; count: bigint }[]>(
      `SELECT to_char(timestamp, 'YYYY-MM') as month, COUNT(*)::bigint as count
       FROM requests
       WHERE "projectId" = ANY($1::text[]) AND timestamp >= $2
       GROUP BY month ORDER BY month`,
      projectIds,
      twelveMonthsAgo,
    );
    monthlyApiCalls = rawMonthly.map((r) => ({ month: r.month, count: Number(r.count) }));
  }

  // Feature usage summary (which providers/models used)
  let featureUsage: { provider: string; model: string; count: number }[] = [];
  if (projectIds.length > 0) {
    const rawFeatures = await prisma.$queryRawUnsafe<{ provider: string; model: string; count: bigint }[]>(
      `SELECT provider, model, COUNT(*)::bigint as count
       FROM requests
       WHERE "projectId" = ANY($1::text[])
       GROUP BY provider, model ORDER BY count DESC LIMIT 20`,
      projectIds,
    );
    featureUsage = rawFeatures.map((r) => ({ provider: r.provider, model: r.model, count: Number(r.count) }));
  }

  // Build user timeline events
  const timeline: { date: string; event: string; detail?: string }[] = [];
  timeline.push({ date: user.createdAt.toISOString(), event: 'registered' });
  if (user.integrationCompletedAt) {
    timeline.push({ date: user.integrationCompletedAt.toISOString(), event: 'sdk_integrated' });
  }
  if (user.firstApiCallAt) {
    timeline.push({ date: user.firstApiCallAt.toISOString(), event: 'first_api_call' });
  }
  for (const h of user.subscriptionHistory) {
    timeline.push({
      date: h.timestamp.toISOString(),
      event: h.event,
      detail: h.oldTier && h.newTier ? `${h.oldTier} → ${h.newTier}` : undefined,
    });
  }
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const { passwordHash, ...safeUser } = user;
  return {
    ...safeUser,
    tags: user.tags.map((t) => t.tag),
    monthlyApiCalls,
    featureUsage,
    timeline,
    daysSinceLastActivity: user.lastApiCallAt
      ? Math.floor((Date.now() - new Date(user.lastApiCallAt).getTime()) / (1000 * 60 * 60 * 24))
      : null,
  };
}

/* ─── Segment Counts (for badges) ─── */

export async function getSegmentCounts() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    hotUpgradeLeads,
    ghosts,
    winBack,
    newThisMonth,
    newActive,
    longTermFree,
    goingDormant,
  ] = await Promise.all([
    // Hot Upgrade Leads: free + active 7d + hit limit 1+
    prisma.user.count({
      where: {
        isAdmin: false,
        subscriptionTier: 'FREE',
        lastApiCallAt: { gte: sevenDaysAgo },
        freeLimitHitCount: { gte: 1 },
      },
    }),
    // Ghosts: never made API call, registered 7+ days ago
    prisma.user.count({
      where: {
        isAdmin: false,
        firstApiCallAt: null,
        createdAt: { lte: sevenDaysAgo },
      },
    }),
    // Win-back: was on paid, now on free
    prisma.user.count({
      where: {
        isAdmin: false,
        subscriptionTier: 'FREE',
        subscriptionHistory: {
          some: {
            oldTier: { in: ['STARTER', 'PRO', 'ENTERPRISE'] },
            newTier: 'FREE',
          },
        },
      },
    }),
    // New this month
    prisma.user.count({
      where: { isAdmin: false, createdAt: { gte: startOfMonth } },
    }),
    // New + Active
    prisma.user.count({
      where: {
        isAdmin: false,
        createdAt: { gte: startOfMonth },
        firstApiCallAt: { not: null },
      },
    }),
    // Long-term free: free for 60+ days + still active
    prisma.user.count({
      where: {
        isAdmin: false,
        subscriptionTier: 'FREE',
        createdAt: { lte: sixtyDaysAgo },
        lastApiCallAt: { gte: sevenDaysAgo },
      },
    }),
    // Going dormant: warning zone (integrated status = 7-14 days)
    prisma.user.count({
      where: { isAdmin: false, userStatus: 'integrated' },
    }),
  ]);

  return {
    hot_upgrade_leads: hotUpgradeLeads,
    ghosts,
    win_back: winBack,
    new_this_month: newThisMonth,
    new_active: newActive,
    long_term_free: longTermFree,
    going_dormant: goingDormant,
  };
}

/* ─── Existing functions (unchanged) ─── */

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

export async function overrideSubscription(
  userId: string,
  tier: SubscriptionTier,
  reason?: string,
  charged: boolean = false
) {
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
        planStartedAt: new Date(),
      },
    }),
    prisma.subscriptionHistory.create({
      data: {
        userId,
        event,
        oldTier: user.subscriptionTier,
        newTier: tier,
        reason: reason || (charged ? 'Admin override (charged)' : 'Admin override (complimentary)'),
        metadata: { adminAction: true, charged, previousStatus: user.subscriptionStatus },
      },
    }),
  ];

  if (tier !== 'FREE') {
    if (charged && PLAN_PRICES[tier] > 0) {
      // Charged: real revenue — appears in revenue totals
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
    } else {
      // Complimentary: $0 — audit trail only, excluded from revenue totals
      operations.push(
        prisma.invoice.create({
          data: {
            userId,
            stripeInvoiceId: `admin_comp_${Date.now()}`,
            amount: 0,
            currency: 'usd',
            status: 'paid',
            paidAt: new Date(),
          },
        })
      );
    }
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
    userStatusCounts,
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
      select: { id: true, email: true, name: true, subscriptionTier: true, userStatus: true, createdAt: true },
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
    prisma.user.groupBy({
      by: ['userStatus'],
      where: { isAdmin: false },
      _count: true,
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

  const userStatusMap: Record<string, number> = {};
  for (const s of userStatusCounts) userStatusMap[s.userStatus] = s._count;

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
    userStatusBreakdown: userStatusMap,
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
  const [invoices, tierCounts] = await Promise.all([
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
  ]);

  // Comp invoices ($0, admin_comp_*) are excluded from all revenue figures
  const revenueInvoices = invoices.filter((inv) => !inv.stripeInvoiceId.startsWith('admin_comp_'));
  const compInvoices = invoices.filter((inv) => inv.stripeInvoiceId.startsWith('admin_comp_'));

  const totalRevenue = revenueInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

  const monthlyRevenue: Record<string, { revenue: number; count: number }> = {};
  for (const inv of revenueInvoices) {
    const month = inv.createdAt.toISOString().slice(0, 7);
    if (!monthlyRevenue[month]) monthlyRevenue[month] = { revenue: 0, count: 0 };
    monthlyRevenue[month].revenue += Number(inv.amount);
    monthlyRevenue[month].count++;
  }

  let adminRevenue = 0;
  let stripeRevenue = 0;
  for (const inv of revenueInvoices) {
    const amount = Number(inv.amount);
    if (inv.stripeInvoiceId.startsWith('admin_override')) adminRevenue += amount;
    else stripeRevenue += amount;
  }
  const compCount = compInvoices.length;

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
    invoiceCount: revenueInvoices.length,
    compCount,
    monthlyRevenue: Object.entries(monthlyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, revenue: data.revenue, count: data.count })),
    revenueBySource: { stripe: stripeRevenue, admin: adminRevenue },
    mrrByTier,
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

export async function getInvoices(query: z.infer<typeof invoiceQuerySchema>) {
  const { page, limit, search, source, from, to } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.InvoiceWhereInput = { status: 'paid' };

  if (source === 'comp') {
    where.stripeInvoiceId = { startsWith: 'admin_comp_' };
  } else if (source === 'admin') {
    where.stripeInvoiceId = { startsWith: 'admin_override_' };
  } else if (source === 'stripe') {
    where.AND = [
      { NOT: { stripeInvoiceId: { startsWith: 'admin_comp_' } } },
      { NOT: { stripeInvoiceId: { startsWith: 'admin_override_' } } },
    ];
  }

  if (from || to) {
    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.lte = toDate;
    }
    const dateCondition: Prisma.InvoiceWhereInput = { createdAt: dateFilter };
    where.AND = where.AND
      ? [...(where.AND as Prisma.InvoiceWhereInput[]), dateCondition]
      : [dateCondition];
  }

  if (search) {
    const searchCondition: Prisma.InvoiceWhereInput = {
      OR: [
        { stripeInvoiceId: { contains: search, mode: 'insensitive' } },
        { stripePaymentIntentId: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ],
    };
    where.AND = where.AND
      ? [...(where.AND as Prisma.InvoiceWhereInput[]), searchCondition]
      : [searchCondition];
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, email: true, name: true, subscriptionTier: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return {
    invoices: invoices.map((inv) => ({
      id: inv.id,
      stripeInvoiceId: inv.stripeInvoiceId,
      stripePaymentIntentId: inv.stripePaymentIntentId,
      amount: Number(inv.amount),
      currency: inv.currency,
      status: inv.status,
      source: inv.stripeInvoiceId.startsWith('admin_comp_') ? 'comp'
        : inv.stripeInvoiceId.startsWith('admin_override') ? 'admin'
        : 'stripe',
      paidAt: inv.paidAt,
      createdAt: inv.createdAt,
      invoiceUrl: inv.invoiceUrl,
      invoicePdf: inv.invoicePdf,
      userId: inv.user.id,
      userEmail: inv.user.email,
      userName: inv.user.name,
      userTier: inv.user.subscriptionTier,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getSubscriptionEvents(query: z.infer<typeof subscriptionEventsQuerySchema>) {
  const { page, limit, search, event } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.SubscriptionHistoryWhereInput = {};
  if (event) where.event = event;
  if (search) where.user = { email: { contains: search, mode: 'insensitive' } };

  const [events, total] = await Promise.all([
    prisma.subscriptionHistory.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
      include: { user: { select: { id: true, email: true, name: true } } },
    }),
    prisma.subscriptionHistory.count({ where }),
  ]);

  return {
    events: events.map((e) => ({
      id: e.id,
      event: e.event,
      oldTier: e.oldTier,
      newTier: e.newTier,
      reason: e.reason,
      metadata: e.metadata,
      timestamp: e.timestamp,
      userId: e.user.id,
      userEmail: e.user.email,
      userName: e.user.name,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
