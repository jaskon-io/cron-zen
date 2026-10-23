import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue2';
import { resolve } from 'node:path';

/**
 * @description Vitest 配置：jsdom + Vue2 SFC，core 走源码 alias
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    // 强制本包测试解析到 Vue 2.7，避免 monorepo 中 vue3 抢占
    dedupe: ['vue'],
    alias: {
      '@cron-zen/core': resolve(__dirname, '../core/src/index.ts'),
      vue: resolve(__dirname, 'node_modules/vue'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['__tests__/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    server: {
      deps: {
        inline: ['vue', '@vue/test-utils', 'vue-template-compiler'],
      },
    },
  },
});
