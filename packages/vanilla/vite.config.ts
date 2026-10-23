import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/**
 * @description Vite lib 构建：ESM + UMD，外置 @cron-zen/core
 */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CronZenVanilla',
      fileName: 'cron-zen-vanilla',
    },
    rollupOptions: {
      external: ['@cron-zen/core'],
      output: {
        exports: 'named',
        globals: {
          '@cron-zen/core': 'CronZenCore',
        },
        assetFileNames: 'cron-zen-vanilla.[ext]',
      },
    },
    cssCodeSplit: false,
  },
});
