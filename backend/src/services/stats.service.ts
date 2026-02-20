import { prisma } from '../utils/prisma.js';
import { verifyProjectAccess } from '../utils/projectAccess.js';

export async function getDashboardStats(projectId: string, userId: string) {
  await verifyProjectAccess(projectId, userId);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [todayStats, weekStats, totalStats] = await Promise.all([
    prisma.request.aggregate({
      where: { projectId, timestamp: { gte: todayStart } },
      _count: true,
      _sum: { totalCost: true, totalTokens: true },
      _avg: { latencyMs: true },
    }),
    prisma.request.aggregate({
      where: { projectId, timestamp: { gte: weekAgo } },
      _sum: { totalCost: true },
    }),
    prisma.request.aggregate({
      where: { projectId },
      _count: true,
      _sum: { totalCost: true },
    }),
  ]);

  const [todayErrors, totalErrors] = await Promise.all([
    prisma.request.count({ where: { projectId, status: 'error', timestamp: { gte: todayStart } } }),
    prisma.request.count({ where: { projectId, status: 'error' } }),
  ]);

  return {
    today: {
      requests: todayStats._count,
      cost: Number(todayStats._sum.totalCost || 0),
      tokens: todayStats._sum.totalTokens || 0,
      errors: todayErrors,
      avgLatency: Math.round(todayStats._avg.latencyMs || 0),
    },
    week: {
      cost: Number(weekStats._sum.totalCost || 0),
    },
    total: {
      requests: totalStats._count,
      cost: Number(totalStats._sum.totalCost || 0),
      errors: totalErrors,
    },
  };
}

export async function getRequestTimeline(projectId: string, userId: string, period: 'day' | 'week' = 'day') {
  await verifyProjectAccess(projectId, userId);

  const now = new Date();
  const since = period === 'day'
    ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
    : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const requests = await prisma.request.findMany({
    where: { projectId, timestamp: { gte: since } },
    select: { timestamp: true, status: true },
    orderBy: { timestamp: 'asc' },
  });

  // Group by hour (day) or by day (week)
  const buckets: Record<string, { total: number; errors: number }> = {};

  for (const req of requests) {
    const key = period === 'day'
      ? req.timestamp.toISOString().slice(0, 13) // hour
      : req.timestamp.toISOString().slice(0, 10); // day
    if (!buckets[key]) buckets[key] = { total: 0, errors: 0 };
    buckets[key].total++;
    if (req.status === 'error') buckets[key].errors++;
  }

  return Object.entries(buckets).map(([time, data]) => ({
    time,
    total: data.total,
    errors: data.errors,
  }));
}

export async function getCostBreakdown(projectId: string, userId: string, period: number = 7) {
  await verifyProjectAccess(projectId, userId);

  // Clamp period to valid range
  const days = Math.min(Math.max(period, 7), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const yesterdayStart = new Date(new Date(Date.now() - 86_400_000).setHours(0, 0, 0, 0));

  const [byModel, byProvider, todayAgg, yesterdayAgg, topExpensive] = await Promise.all([
    // Cost + token breakdown per model
    prisma.request.groupBy({
      by: ['model'],
      where: { projectId, timestamp: { gte: since } },
      _sum: { totalCost: true, totalTokens: true, promptTokens: true, completionTokens: true },
      _count: true,
      orderBy: { _sum: { totalCost: 'desc' } },
    }),
    // Cost + token breakdown per provider
    prisma.request.groupBy({
      by: ['provider'],
      where: { projectId, timestamp: { gte: since } },
      _sum: { totalCost: true, totalTokens: true },
      _count: true,
      orderBy: { _sum: { totalCost: 'desc' } },
    }),
    // Today's cost
    prisma.request.aggregate({
      where: { projectId, timestamp: { gte: todayStart } },
      _sum: { totalCost: true },
      _count: true,
    }),
    // Yesterday's cost
    prisma.request.aggregate({
      where: { projectId, timestamp: { gte: yesterdayStart, lt: todayStart } },
      _sum: { totalCost: true },
      _count: true,
    }),
    // Top 10 most expensive requests
    prisma.request.findMany({
      where: { projectId, timestamp: { gte: since } },
      orderBy: { totalCost: 'desc' },
      take: 10,
      select: {
        id: true, provider: true, model: true,
        promptTokens: true, completionTokens: true,
        totalCost: true, totalTokens: true,
        latencyMs: true, status: true, timestamp: true,
      },
    }),
  ]);

  // Daily cost using efficient DB-level grouping
  const dailyCostRaw = await prisma.$queryRawUnsafe<{ date: string; cost: number; count: bigint }[]>(
    `SELECT to_char(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD') as date,
            SUM("totalCost")::float as cost,
            COUNT(*)::bigint as count
     FROM requests
     WHERE "projectId" = $1 AND timestamp >= $2
     GROUP BY date ORDER BY date`,
    projectId,
    since,
  );

  // Period totals
  const totalCost = byModel.reduce((s, m) => s + Number(m._sum.totalCost || 0), 0);
  const totalRequests = byModel.reduce((s, m) => s + m._count, 0);
  const avgCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
  const dailyBurnRate = totalCost / days;
  const todayCost = Number(todayAgg._sum.totalCost || 0);
  const yesterdayCost = Number(yesterdayAgg._sum.totalCost || 0);

  return {
    summary: {
      totalCost,
      totalRequests,
      avgCostPerRequest,
      dailyBurnRate,
      projectedMonthlyCost: dailyBurnRate * 30,
      todayCost,
      yesterdayCost,
      // null means no data to compare against
      costTrend: yesterdayCost > 0
        ? Math.round(((todayCost - yesterdayCost) / yesterdayCost) * 1000) / 10
        : null,
    },
    costByModel: byModel.map((m) => {
      const cost = Number(m._sum.totalCost || 0);
      return {
        model: m.model,
        cost,
        tokens: Number(m._sum.totalTokens || 0),
        promptTokens: Number(m._sum.promptTokens || 0),
        completionTokens: Number(m._sum.completionTokens || 0),
        count: m._count,
        avgCostPerRequest: m._count > 0 ? cost / m._count : 0,
        percentOfTotal: totalCost > 0 ? (cost / totalCost) * 100 : 0,
      };
    }),
    costByProvider: byProvider.map((p) => {
      const cost = Number(p._sum.totalCost || 0);
      return {
        provider: p.provider,
        cost,
        tokens: Number(p._sum.totalTokens || 0),
        count: p._count,
        percentOfTotal: totalCost > 0 ? (cost / totalCost) * 100 : 0,
      };
    }),
    dailyCost: dailyCostRaw.map((r) => ({ date: r.date, cost: r.cost, count: Number(r.count) })),
    topRequests: topExpensive.map((r) => ({ ...r, totalCost: Number(r.totalCost) })),
  };
}

export async function getErrorStats(
  projectId: string,
  userId: string,
  options: {
    period?: number;
    model?: string;
    errorType?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  await verifyProjectAccess(projectId, userId);

  const { period = 7, model, errorType, search, page = 1, limit = 20 } = options;
  const days = Math.min(Math.max(period, 1), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Base where for all errors in period (no additional filters)
  const whereAllErrors = {
    projectId,
    status: 'error' as const,
    timestamp: { gte: since },
  };

  // Filtered where (includes model/errorType/search)
  const whereFiltered: Record<string, unknown> = {
    projectId,
    status: 'error',
    timestamp: { gte: since },
  };
  if (model) whereFiltered['model'] = { contains: model, mode: 'insensitive' };
  if (errorType) whereFiltered['errorType'] = errorType;
  if (search) whereFiltered['errorMessage'] = { contains: search, mode: 'insensitive' };

  const skip = (page - 1) * limit;

  const [byType, recentErrors, totalRequests, totalErrors, filteredErrorsCount] = await Promise.all([
    // Group by error type using unfiltered (period only) — so the chart stays meaningful
    prisma.request.groupBy({
      by: ['errorType'],
      where: { ...whereAllErrors, errorType: { not: null } },
      _count: true,
    }),
    // Paginated recent errors with all filters
    prisma.request.findMany({
      where: whereFiltered as any,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip,
      select: {
        id: true,
        model: true,
        provider: true,
        errorMessage: true,
        errorType: true,
        timestamp: true,
        latencyMs: true,
        promptTokens: true,
        completionTokens: true,
        totalCost: true,
      },
    }),
    // All requests in period
    prisma.request.count({ where: { projectId, timestamp: { gte: since } } }),
    // All errors in period (unfiltered)
    prisma.request.count({ where: whereAllErrors }),
    // Filtered error count for pagination
    prisma.request.count({ where: whereFiltered as any }),
  ]);

  // Daily trend: group by day in JS (error count per day, respects filters)
  const errorsForTrend = await prisma.request.findMany({
    where: whereFiltered as any,
    select: { timestamp: true },
    orderBy: { timestamp: 'asc' },
  });

  const trendMap: Record<string, number> = {};
  for (const r of errorsForTrend) {
    const day = r.timestamp.toISOString().slice(0, 10);
    trendMap[day] = (trendMap[day] || 0) + 1;
  }
  const dailyTrend = Object.entries(trendMap).map(([date, count]) => ({ date, count }));

  return {
    errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
    totalErrors,
    totalRequests,
    filteredErrors: filteredErrorsCount,
    errorsByType: byType.map((t) => ({
      type: t.errorType,
      count: t._count,
      percentage: totalErrors > 0 ? t._count / totalErrors : 0,
    })),
    recentErrors,
    pagination: {
      page,
      limit,
      total: filteredErrorsCount,
      totalPages: Math.ceil(filteredErrorsCount / limit),
    },
    dailyTrend,
  };
}

export async function getOptimizationSuggestions(projectId: string, userId: string) {
  await verifyProjectAccess(projectId, userId);

  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const requests = await prisma.request.findMany({
    where: { projectId, timestamp: { gte: monthAgo }, status: 'success' },
    select: { model: true, promptTokens: true, completionTokens: true, totalCost: true, prompt: true },
  });

  const suggestions: Array<{ id: string; type: string; title: string; description: string; impact: string; estimatedSavings: number }> = [];

  // Model downgrade: GPT-4 used for simple tasks (short prompts)
  const gpt4Requests = requests.filter((r) => r.model.startsWith('gpt-4') && !r.model.includes('mini'));
  const simpleGpt4 = gpt4Requests.filter((r) => r.promptTokens < 200);
  if (simpleGpt4.length > 10) {
    const potentialSavings = simpleGpt4.reduce((sum, r) => sum + Number(r.totalCost) * 0.8, 0);
    suggestions.push({
      id: 'model-switch-gpt4',
      type: 'model_switch',
      title: 'Use cheaper models for simple tasks',
      description: `${simpleGpt4.length} requests used GPT-4 with fewer than 200 prompt tokens. Consider gpt-3.5-turbo or gpt-4o-mini.`,
      impact: 'high',
      estimatedSavings: Math.round(potentialSavings * 100) / 100,
    });
  }

  // Repeated prompts (caching opportunity)
  const promptCounts: Record<string, number> = {};
  for (const r of requests) {
    if (r.prompt) {
      const key = r.prompt.slice(0, 500);
      promptCounts[key] = (promptCounts[key] || 0) + 1;
    }
  }
  const duplicates = Object.values(promptCounts).filter((c) => c > 3);
  if (duplicates.length > 0) {
    const totalDupes = duplicates.reduce((sum, c) => sum + c - 1, 0);
    suggestions.push({
      id: 'caching-repeated-prompts',
      type: 'caching',
      title: 'Cache repeated prompts',
      description: `Found ${duplicates.length} unique prompts sent more than 3 times (${totalDupes} duplicate calls total).`,
      impact: 'medium',
      estimatedSavings: 0,
    });
  }

  // Verbose prompts (token waste)
  const verbose = requests.filter((r) => r.promptTokens > 2000);
  if (verbose.length > requests.length * 0.3) {
    suggestions.push({
      id: 'prompt-optimization-verbose',
      type: 'prompt_optimization',
      title: 'Reduce prompt verbosity',
      description: `${verbose.length} requests (${Math.round(verbose.length / requests.length * 100)}%) use over 2000 prompt tokens. Consider more concise prompts.`,
      impact: 'medium',
      estimatedSavings: 0,
    });
  }

  return { suggestions, totalRequests: requests.length };
}

export async function getToolStats(
  projectId: string,
  userId: string,
  options: { period?: number; page?: number; limit?: number } = {}
) {
  await verifyProjectAccess(projectId, userId);

  const { period = 7, page = 1, limit = 20 } = options;
  const days = Math.min(Math.max(period, 1), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const skip = (page - 1) * limit;

  const [byTool, totalCalls, failedCalls, recentFailed, failedTotal] = await Promise.all([
    prisma.toolCall.groupBy({
      by: ['toolName'],
      where: { request: { projectId, timestamp: { gte: since } } },
      _count: true,
      _avg: { latencyMs: true },
      orderBy: { _count: { toolName: 'desc' } },
    }),
    prisma.toolCall.count({ where: { request: { projectId, timestamp: { gte: since } } } }),
    prisma.toolCall.count({ where: { request: { projectId, timestamp: { gte: since } }, status: 'error' } }),
    prisma.toolCall.findMany({
      where: { request: { projectId, timestamp: { gte: since } }, status: 'error' },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip,
      select: { id: true, toolName: true, errorMessage: true, timestamp: true, latencyMs: true },
    }),
    prisma.toolCall.count({ where: { request: { projectId, timestamp: { gte: since } }, status: 'error' } }),
  ]);

  return {
    totalCalls,
    failedCalls,
    successRate: totalCalls > 0 ? ((totalCalls - failedCalls) / totalCalls) * 100 : 100,
    byTool: byTool.map((t) => ({
      name: t.toolName,
      count: t._count,
      avgLatency: Math.round(t._avg.latencyMs || 0),
      errorRate: 0, // computed below if needed
    })),
    recentFailed,
    pagination: {
      page,
      limit,
      total: failedTotal,
      totalPages: Math.ceil(failedTotal / limit),
    },
  };
}
