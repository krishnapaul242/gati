import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '**/*.config.*',
        '**/*.d.ts',
        'tests/fixtures/**',
        'examples/**',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'build'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@gati-framework/core': resolve(__dirname, './packages/core/src/index.ts'),
      '@gati/cli': resolve(__dirname, './packages/cli/src'),
      '@gati/types': resolve(__dirname, './src/runtime/types/index.ts'),
    },
  },
});
