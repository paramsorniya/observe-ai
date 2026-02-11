import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { NotFoundError, ForbiddenError } from '../errors/AppError.js';

export const requestQuerySchema = z.object({
  projectId: z.string(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['success', 'error']).optional(),
  model: z.string().optional(),
  provider: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sessionId: z.string().optional(),
  sortBy: z.enum(['timestamp', 'totalCost', 'latencyMs', 'totalTokens']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function getRequests(userId: string, query: z.infer<typeof requestQuerySchema>) {
  // Verify project ownership
  const project = await prisma.project.findUnique({ where: { id: query.projectId } });
  if (!project) throw new NotFoundError('Project not found');
  if (project.userId !== userId) throw new ForbiddenError('Access denied');

  const where: any = { projectId: query.projectId };

  if (query.status) where.status = query.status;
  if (query.model) where.model = query.model;
  if (query.provider) where.provider = query.provider;
  if (query.sessionId) where.sessionId = query.sessionId;
  if (query.startDate || query.endDate) {
    where.timestamp = {};
    if (query.startDate) where.timestamp.gte = new Date(query.startDate);
    if (query.endDate) where.timestamp.lte = new Date(query.endDate);
  }
  if (query.search) {
    where.OR = [
      { prompt: { contains: query.search, mode: 'insensitive' } },
      { response: { contains: query.search, mode: 'insensitive' } },
      { model: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const skip = (query.page - 1) * query.limit;

  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortOrder },
      skip,
      take: query.limit,
      include: { _count: { select: { toolCalls: true } } },
    }),
    prisma.request.count({ where }),
  ]);

  return {
    requests,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getRequestById(requestId: string, userId: string) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      toolCalls: true,
      project: { select: { userId: true } },
    },
  });

  if (!request) throw new NotFoundError('Request not found');
  if (request.project.userId !== userId) throw new ForbiddenError('Access denied');

  return request;
}

export async function exportCsv(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new NotFoundError('Project not found');
  if (project.userId !== userId) throw new ForbiddenError('Access denied');

  const requests = await prisma.request.findMany({
    where: { projectId },
    orderBy: { timestamp: 'desc' },
    take: 10000,
  });

  const header = 'timestamp,provider,model,promptTokens,completionTokens,totalTokens,totalCost,latencyMs,status,errorType\n';
  const rows = requests.map((r) =>
    `${r.timestamp.toISOString()},${r.provider},${r.model},${r.promptTokens},${r.completionTokens},${r.totalTokens},${r.totalCost},${r.latencyMs},${r.status},${r.errorType || ''}`
  ).join('\n');

  return header + rows;
}
