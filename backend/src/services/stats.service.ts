import { prisma } from '../utils/prisma.js';
import { NotFoundError, ForbiddenError } from '../errors/AppError.js';

async function verifyProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError('Project not found');
  if (project.userId !== userId) throw new ForbiddenError('Access denied');
  return project;
}

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

export async function getCostBreakdown(projectId: string, userId: string) {
  await verifyProjectAccess(projectId, userId);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [byModel, recentRequests] = await Promise.all([
    prisma.request.groupBy({
      by: ['model'],
      where: { projectId, timestamp: { gte: weekAgo } },
      _sum: { totalCost: true, totalTokens: true },
      _count: true,
      orderBy: { _sum: { totalCost: 'desc' } },
    }),
    prisma.request.findMany({
      where: { projectId, timestamp: { gte: weekAgo } },
      select: { timestamp: true, totalCost: true },
      orderBy: { timestamp: 'asc' },
    }),
  ]);

  // Daily cost timeline
  const dailyCost: Record<string, number> = {};
  for (const req of recentRequests) {
    const day = req.timestamp.toISOString().slice(0, 10);
    dailyCost[day] = (dailyCost[day] || 0) + Number(req.totalCost);
  }

  // Top expensive requests
  const topExpensive = await prisma.request.findMany({
    where: { projectId, timestamp: { gte: weekAgo } },
    orderBy: { totalCost: 'desc' },
    take: 10,
    select: { id: true, model: true, totalCost: true, totalTokens: true, latencyMs: true, status: true, timestamp: true },
  });

  return {
    costByModel: byModel.map((m) => ({
      model: m.model,
      cost: Number(m._sum.totalCost || 0),
      tokens: m._sum.totalTokens || 0,
      count: m._count,
    })),
    dailyCost: Object.entries(dailyCost).map(([date, cost]) => ({ date, cost })),
    topRequests: topExpensive.map((r) => ({ ...r, totalCost: Number(r.totalCost) })),
  };
}

export async function getErrorStats(projectId: string, userId: string) {
  await verifyProjectAccess(projectId, userId);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [byType, recentErrors, totalRequests, totalErrors] = await Promise.all([
    prisma.request.groupBy({
      by: ['errorType'],
      where: { projectId, status: 'error', timestamp: { gte: weekAgo }, errorType: { not: null } },
      _count: true,
    }),
    prisma.request.findMany({
      where: { projectId, status: 'error', timestamp: { gte: weekAgo } },
      orderBy: { timestamp: 'desc' },
      take: 20,
      select: { id: true, model: true, errorMessage: true, errorType: true, timestamp: true, latencyMs: true },
    }),
    prisma.request.count({ where: { projectId, timestamp: { gte: weekAgo } } }),
    prisma.request.count({ where: { projectId, status: 'error', timestamp: { gte: weekAgo } } }),
  ]);

  return {
    errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
    totalErrors,
    totalRequests,
    errorsByType: byType.map((t) => ({
      type: t.errorType,
      count: t._count,
      percentage: totalErrors > 0 ? t._count / totalErrors : 0,
    })),
    recentErrors,
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

export async function getToolStats(projectId: string, userId: string) {
  await verifyProjectAccess(projectId, userId);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [byTool, totalCalls, failedCalls, recentFailed] = await Promise.all([
    prisma.toolCall.groupBy({
      by: ['toolName'],
      where: { request: { projectId, timestamp: { gte: weekAgo } } },
      _count: true,
      _avg: { latencyMs: true },
    }),
    prisma.toolCall.count({ where: { request: { projectId, timestamp: { gte: weekAgo } } } }),
    prisma.toolCall.count({ where: { request: { projectId, timestamp: { gte: weekAgo } }, status: 'error' } }),
    prisma.toolCall.findMany({
      where: { request: { projectId, timestamp: { gte: weekAgo } }, status: 'error' },
      orderBy: { timestamp: 'desc' },
      take: 20,
      select: { id: true, toolName: true, errorMessage: true, timestamp: true, latencyMs: true },
    }),
  ]);

  return {
    totalCalls,
    failedCalls,
    successRate: totalCalls > 0 ? ((totalCalls - failedCalls) / totalCalls) * 100 : 100,
    byTool: byTool.map((t) => ({
      name: t.toolName,
      count: t._count,
      avgLatency: Math.round(t._avg.latencyMs || 0),
    })),
    recentFailed,
  };
}
