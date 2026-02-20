import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/middleware/**',
        'src/utils/pricing.ts',
        'src/utils/features.ts',
        'src/utils/apiKey.ts',
        'src/services/auth.service.ts',
        'src/services/sdkLog.service.ts',
        'src/services/project.service.ts',
        'src/services/user.service.ts',
      ],
      exclude: ['src/__tests__/**'],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
});
