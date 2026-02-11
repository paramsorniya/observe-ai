import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../utils/prisma.js';

const toolCallSchema = z.object({
  toolName: z.string(),
  toolInput: z.string().optional(),
  toolOutput: z.string().optional(),
  latencyMs: z.number().int().min(0).optional(),
  status: z.string().optional(),
  errorMessage: z.string().optional(),
});

const logEntrySchema = z.object({
  timestamp: z.string().datetime().optional(),
  provider: z.string(),
  model: z.string(),
  promptTokens: z.number().int().min(0).default(0),
  completionTokens: z.number().int().min(0).default(0),
  totalTokens: z.number().int().min(0).optional(),
  totalCost: z.number().min(0).default(0),
  latencyMs: z.number().int().min(0).default(0),
  status: z.enum(['success', 'error']).default('success'),
  errorMessage: z.string().optional(),
  errorType: z.string().optional(),
  prompt: z.string().max(100000).optional(),
  response: z.string().max(100000).optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  endpoint: z.string().optional(),
  tags: z.array(z.string()).optional(),
  toolCalls: z.array(toolCallSchema).optional(),
});

export const batchLogSchema = z.object({
  requests: z.array(logEntrySchema).min(1).max(100),
});

export async function ingestBatch(projectId: string, userId: string, data: z.infer<typeof batchLogSchema>) {
  const entries = data.requests;

  const result = await prisma.$transaction(async (tx) => {
    const created = [];

    for (const entry of entries) {
      const totalTokens = entry.totalTokens ?? (entry.promptTokens + entry.completionTokens);

      const request = await tx.request.create({
        data: {
          projectId,
          timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
          provider: entry.provider,
          model: entry.model,
          promptTokens: entry.promptTokens,
          completionTokens: entry.completionTokens,
          totalTokens,
          totalCost: new Decimal(entry.totalCost),
          latencyMs: entry.latencyMs,
          status: entry.status,
          errorMessage: entry.errorMessage,
          errorType: entry.errorType,
          prompt: entry.prompt,
          response: entry.response,
          userId: entry.userId,
          sessionId: entry.sessionId,
          endpoint: entry.endpoint,
          tags: entry.tags || [],
        },
      });

      if (entry.toolCalls?.length) {
        await tx.toolCall.createMany({
          data: entry.toolCalls.map((tc) => ({
            requestId: request.id,
            toolName: tc.toolName,
            toolInput: tc.toolInput,
            toolOutput: tc.toolOutput,
            latencyMs: tc.latencyMs,
            status: tc.status || 'called',
            errorMessage: tc.errorMessage,
          })),
        });
      }

      created.push(request);
    }

    // Increment usage counter atomically
    await tx.user.update({
      where: { id: userId },
      data: { monthlyRequestCount: { increment: entries.length } },
    });

    return created;
  });

  return { ingested: result.length };
}
