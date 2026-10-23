import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

/**
 * @description Vitest：jsdom + core 源码 alias
 */
export default defineConfig({
  resolve: {
    alias: {
      '@cron-zen/core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['__tests__/**/*.test.ts'],
  },
});
