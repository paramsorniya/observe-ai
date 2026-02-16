import { vi } from 'vitest';

// Stub environment variables before config.ts parses them
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.PORT = '3001';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.ADMIN_URL = 'http://localhost:5174';

// Mock Prisma globally
vi.mock('../utils/prisma.js', () => {
  return import('./mocks/prisma.js');
});
