import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as sdkLogService from '../../../services/sdkLog.service.js';
import { prisma } from '../../mocks/prisma.js';

const mockRequest = {
  id: 'req-1',
  projectId: 'proj-1',
  provider: 'openai',
  model: 'gpt-4o',
  status: 'success',
};

// Base log entry that satisfies the service's expectations (defaults already applied)
const baseEntry = {
  provider: 'openai',
  model: 'gpt-4o',
  promptTokens: 0,
  completionTokens: 0,
  totalCost: 0,
  latencyMs: 0,
  status: 'success' as const,
};

const mockUser = {
  id: 'user-1',
  firstApiCallAt: null,
  userStatus: 'new',
};

describe('sdkLog.service — ingestBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: $transaction passes through its callback
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(prisma));
    vi.mocked(prisma.request.create).mockResolvedValue(mockRequest as any);
    vi.mocked(prisma.toolCall.createMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({ ...mockUser } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
  });

  it('creates one request record per log entry', async () => {
    const data = {
      requests: [
        { ...baseEntry },
        { ...baseEntry, provider: 'anthropic', model: 'claude-3-haiku' },
      ],
    };

    await sdkLogService.ingestBatch('proj-1', 'user-1', data as any);

    expect(prisma.request.create).toHaveBeenCalledTimes(2);
  });

  it('returns { ingested: N } matching batch size', async () => {
    const data = { requests: [{ ...baseEntry }] };

    const result = await sdkLogService.ingestBatch('proj-1', 'user-1', data as any);

    expect(result).toEqual({ ingested: 1 });
  });

  it('creates tool call records when toolCalls are present', async () => {
    const data = {
      requests: [{
        ...baseEntry,
        toolCalls: [
          { toolName: 'search_db', toolInput: '{}', toolOutput: '{}', status: 'called' },
        ],
      }],
    };

    await sdkLogService.ingestBatch('proj-1', 'user-1', data as any);

    expect(prisma.toolCall.createMany).toHaveBeenCalledOnce();
    expect(prisma.toolCall.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ toolName: 'search_db', requestId: 'req-1' }),
        ]),
      })
    );
  });

  it('does not call toolCall.createMany when no tool calls', async () => {
    const data = { requests: [{ ...baseEntry }] };

    await sdkLogService.ingestBatch('proj-1', 'user-1', data as any);

    expect(prisma.toolCall.createMany).not.toHaveBeenCalled();
  });

  it('sets firstApiCallAt when user has no prior API calls', async () => {
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({
      ...mockUser, firstApiCallAt: null,
    } as any);

    const data = { requests: [{ ...baseEntry }] };

    await sdkLogService.ingestBatch('proj-1', 'user-1', data as any);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firstApiCallAt: expect.any(Date),
          integrationCompletedAt: expect.any(Date),
          userStatus: 'active',
        }),
      })
    );
  });

  it('does not set firstApiCallAt when user already has prior API calls', async () => {
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({
      ...mockUser, firstApiCallAt: new Date(),
    } as any);

    const data = { requests: [{ ...baseEntry }] };

    await sdkLogService.ingestBatch('proj-1', 'user-1', data as any);

    const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty('firstApiCallAt');
    expect(updateCall.data).not.toHaveProperty('integrationCompletedAt');
  });

  it('increments monthlyRequestCount by batch size', async () => {
    const data = {
      requests: [
        { ...baseEntry },
        { ...baseEntry },
        { ...baseEntry, provider: 'anthropic', model: 'claude-3-haiku' },
      ],
    };

    await sdkLogService.ingestBatch('proj-1', 'user-1', data as any);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          monthlyRequestCount: { increment: 3 },
          totalApiCallsLifetime: { increment: 3 },
          apiCallsThisMonth: { increment: 3 },
        }),
      })
    );
  });

  it('uses provided timestamp when given', async () => {
    const ts = '2026-01-15T12:00:00.000Z';
    const data = {
      requests: [{ ...baseEntry, timestamp: ts }],
    };

    await sdkLogService.ingestBatch('proj-1', 'user-1', data as any);

    expect(prisma.request.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          timestamp: new Date(ts),
        }),
      })
    );
  });

  it('computes totalTokens from prompt + completion when not provided', async () => {
    const data = {
      requests: [{
        ...baseEntry,
        promptTokens: 100,
        completionTokens: 50,
      }],
    };

    await sdkLogService.ingestBatch('proj-1', 'user-1', data as any);

    expect(prisma.request.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalTokens: 150 }),
      })
    );
  });

  it('runs everything inside a transaction', async () => {
    const data = { requests: [{ ...baseEntry }] };

    await sdkLogService.ingestBatch('proj-1', 'user-1', data as any);

    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });
});
