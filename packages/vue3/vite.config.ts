import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CronZenVue3',
      fileName: 'cron-zen-vue3',
    },
    rollupOptions: {
      external: ['vue', '@cron-zen/core', 'element-plus'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
          '@cron-zen/core': 'CronZenCore',
          'element-plus': 'ElementPlus',
        },
        assetFileNames: 'cron-zen-vue3.[ext]',
      },
    },
    cssCodeSplit: false,
  },
});
