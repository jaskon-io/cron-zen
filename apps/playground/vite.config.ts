import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@cron-zen/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@cron-zen/vue3/style.css': resolve(
        __dirname,
        '../../packages/vue3/src/styles/cron-zen.css',
      ),
      '@cron-zen/vue3': resolve(__dirname, '../../packages/vue3/src/index.ts'),
    },
  },
  optimizeDeps: {
    include: ['element-plus'],
  },
  server: {
    port: 5173,
    open: true,
  },
});
