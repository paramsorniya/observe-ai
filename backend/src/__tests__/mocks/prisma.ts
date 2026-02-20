import { vi } from 'vitest';

function modelMock() {
  return {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findFirst: vi.fn(),
    findFirstOrThrow: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  };
}

export const prisma = {
  user: modelMock(),
  project: modelMock(),
  projectMember: modelMock(),
  projectInvitation: modelMock(),
  request: modelMock(),
  toolCall: modelMock(),
  subscriptionHistory: modelMock(),
  invoice: modelMock(),
  auditLog: modelMock(),
  userTag: modelMock(),
  $transaction: vi.fn(),
};
